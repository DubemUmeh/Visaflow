import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  sql,
  type InferModel,
} from 'drizzle-orm';
import {
  applicationStatusHistory,
  applications,
  paymentLineItems,
  payments,
  systemSettings,
  visaTypes,
} from '@visaflow/database';
import type { PaymentEntity, PaymentSummary } from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
import { ApplicationService } from '../application/application.service';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';
import type {
  CreateCheckoutSessionDto,
  MarkPaymentPaidDto,
} from './dto/payment.dto';

type PaymentRow = InferModel<typeof payments>;
type LineItemRow = InferModel<typeof paymentLineItems>;
type PaymentProvider = 'WALLET' | 'PAYPAL';
type CheckoutProvider = NonNullable<CreateCheckoutSessionDto['provider']>;

type PaymentSettings = {
  paypalEnabled: boolean;
  paypalEmail: string;
  paypalNarration: string;
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  paypalEnabled: true,
  paypalEmail: 'payments@visaflow.com',
  paypalNarration: 'VisaFlow visa application fee',
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dbClient: DatabaseService,
    private readonly configService: ConfigService,
    private readonly applicationService: ApplicationService,
  ) {}

  private isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private toIso(value: Date | string | null | undefined) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  }

  private moneyFromCents(amount: number) {
    return (amount / 100).toFixed(2);
  }

  private toSummary(row: PaymentRow): PaymentSummary {
    return {
      id: row.id,
      status: row.status,
      amountTotal: row.amountTotal,
      currency: row.currency,
      paidAt: this.toIso(row.paidAt),
      createdAt: this.toIso(row.createdAt) ?? '',
    };
  }

  private toEntity(row: PaymentRow, lineItems: LineItemRow[]): PaymentEntity {
    return {
      id: row.id,
      userId: row.userId,
      applicationId: row.applicationId,
      status: row.status,
      provider: row.provider,
      amountTotal: row.amountTotal,
      amountGovFee: row.amountGovFee,
      amountServiceFee: row.amountServiceFee,
      amountTax: row.amountTax,
      amountRefunded: row.amountRefunded,
      currency: row.currency,
      processingTier: row.processingTier,
      description: row.description,
      receiptUrl: row.receiptUrl,
      invoiceUrl: row.invoiceUrl,
      paidAt: this.toIso(row.paidAt),
      createdAt: this.toIso(row.createdAt) ?? '',
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      lineItems: lineItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        totalAmount: item.totalAmount,
        currency: item.currency,
      })),
    };
  }

  private amountForTier(
    tier: 'STANDARD' | 'EXPEDITED' | 'RUSH',
    visaType: InferModel<typeof visaTypes>,
  ) {
    if (tier === 'EXPEDITED') {
      return (
        visaType.priceExpedited ?? Math.round(visaType.priceStandard * 1.5)
      );
    }
    if (tier === 'RUSH') {
      return visaType.priceRush ?? Math.round(visaType.priceStandard * 2.5);
    }
    return visaType.priceStandard;
  }

  private async getPaymentSettings(): Promise<PaymentSettings> {
    const [row] = await this.dbClient.db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, 'payments'))
      .limit(1);

    return {
      ...DEFAULT_PAYMENT_SETTINGS,
      ...((row?.value as Partial<PaymentSettings> | undefined) ?? {}),
    };
  }

  async getOptions() {
    const settings = await this.getPaymentSettings();
    return {
      walletEnabled: true,
      paypalEnabled: settings.paypalEnabled && Boolean(settings.paypalEmail),
      paypalEmail: settings.paypalEmail,
      paypalNarration: settings.paypalNarration,
      methods: ['wallet', 'paypal'],
    };
  }

  private providerFor(provider?: CheckoutProvider): PaymentProvider {
    return provider === 'paypal' ? 'PAYPAL' : 'WALLET';
  }

  private async createPendingPayment(params: {
    userId: string;
    applicationId: string;
    visaTypeId: string;
    referenceNumber: string;
    visaName: string;
    amountTotal: number;
    amountGovFee: number;
    amountServiceFee: number;
    currency: string;
    processingTier: 'STANDARD' | 'EXPEDITED' | 'RUSH';
    provider: PaymentProvider;
    metadata: Record<string, unknown>;
  }) {
    const [payment] = await this.dbClient.db
      .insert(payments)
      .values({
        userId: params.userId,
        applicationId: params.applicationId,
        status: 'PENDING',
        provider: params.provider,
        amountTotal: params.amountTotal,
        amountGovFee: params.amountGovFee,
        amountServiceFee: params.amountServiceFee,
        amountTax: 0,
        amountRefunded: 0,
        currency: params.currency,
        processingTier: params.processingTier,
        description: `${params.visaName} application ${params.referenceNumber}`,
        metadata: params.metadata,
      })
      .returning();

    if (!payment) throw new NotFoundException('Payment could not be created');

    await this.dbClient.db.insert(paymentLineItems).values({
      paymentId: payment.id,
      description: `${params.visaName} (${params.processingTier.toLowerCase()})`,
      quantity: 1,
      unitAmount: params.amountTotal,
      totalAmount: params.amountTotal,
      currency: payment.currency,
      metadata: {
        applicationId: params.applicationId,
        visaTypeId: params.visaTypeId,
      },
    });

    return payment;
  }

  async createCheckout(
    userId: string,
    role: string | undefined,
    dto: CreateCheckoutSessionDto,
  ) {
    const application = await this.applicationService.assertEligibleForPayment(
      dto.applicationId,
      userId,
      role,
    );

    const [visaType] = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(eq(visaTypes.id, application.visaTypeId))
      .limit(1);

    if (!visaType) throw new NotFoundException('Visa type not found');

    const settings = await this.getPaymentSettings();
    const requestedProvider = dto.provider ?? 'wallet';
    const provider = this.providerFor(requestedProvider);
    const amountTotal = this.amountForTier(dto.processingTier, visaType);
    const amountGovFee = visaType.govFee;
    const amountServiceFee = Math.max(0, amountTotal - amountGovFee);
    const currency = dto.currency?.toUpperCase() ?? 'USD';
    const paymentPageUrl = `${dto.successUrl.split('/dashboard/applications/')[0]}/dashboard/payments/${application.id}`;

    if (
      provider === 'PAYPAL' &&
      (!settings.paypalEnabled || !settings.paypalEmail)
    ) {
      throw new ServiceUnavailableException(
        'PayPal payments are not configured.',
      );
    }

    const payment = await this.createPendingPayment({
      userId,
      applicationId: application.id,
      visaTypeId: visaType.id,
      referenceNumber: application.referenceNumber,
      visaName: visaType.name,
      amountTotal,
      amountGovFee,
      amountServiceFee,
      currency,
      processingTier: dto.processingTier,
      provider,
      metadata: {
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        requestedProvider,
      },
    });

    if (provider === 'PAYPAL') {
      const narration = `${settings.paypalNarration} - ${application.referenceNumber}`;
      const checkoutUrl = new URL('https://www.paypal.com/cgi-bin/webscr');
      checkoutUrl.searchParams.set('cmd', '_xclick');
      checkoutUrl.searchParams.set('business', settings.paypalEmail);
      checkoutUrl.searchParams.set('item_name', narration);
      checkoutUrl.searchParams.set('amount', this.moneyFromCents(amountTotal));
      checkoutUrl.searchParams.set('currency_code', currency);
      checkoutUrl.searchParams.set('custom', payment.id);
      checkoutUrl.searchParams.set(
        'return',
        `${paymentPageUrl}?payment_id=${payment.id}&provider=paypal&status=returned`,
      );
      checkoutUrl.searchParams.set(
        'cancel_return',
        `${paymentPageUrl}?payment_id=${payment.id}&provider=paypal&status=cancelled`,
      );

      await this.dbClient.db
        .update(payments)
        .set({ providerSessionId: payment.id })
        .where(eq(payments.id, payment.id));

      return {
        sessionId: payment.id,
        paymentId: payment.id,
        provider: 'paypal',
        checkoutUrl: checkoutUrl.toString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        instructions: { paypalEmail: settings.paypalEmail, narration },
      };
    }

    return {
      sessionId: payment.id,
      paymentId: payment.id,
      provider: 'wallet',
      checkoutUrl: `${paymentPageUrl}?payment_id=${payment.id}&provider=wallet`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      instructions: {
        amount: amountTotal,
        currency,
        referenceNumber: application.referenceNumber,
      },
    };
  }

  async findAll(params: {
    userId: string;
    role?: string;
    page: number;
    limit: number;
    applicationId?: string;
  }) {
    const { skip, take } = buildPaginationSkipTake(params.page, params.limit);
    const conditions = [
      this.isAdmin(params.role)
        ? undefined
        : eq(payments.userId, params.userId),
      params.applicationId
        ? eq(payments.applicationId, params.applicationId)
        : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      this.dbClient.db
        .select()
        .from(payments)
        .where(where)
        .orderBy(desc(payments.createdAt))
        .limit(take)
        .offset(skip),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(payments)
        .where(where),
    ]);

    const lineItems = rows.length
      ? await this.dbClient.db
          .select()
          .from(paymentLineItems)
          .where(
            inArray(
              paymentLineItems.paymentId,
              rows.map((row) => row.id),
            ),
          )
      : [];
    const itemsByPayment = new Map<string, LineItemRow[]>();
    for (const item of lineItems) {
      const current = itemsByPayment.get(item.paymentId) ?? [];
      current.push(item);
      itemsByPayment.set(item.paymentId, current);
    }

    return {
      data: rows.map((row) =>
        this.toEntity(row, itemsByPayment.get(row.id) ?? []),
      ),
      meta: buildPaginationMeta(
        Number(countRows[0]?.count ?? 0),
        params.page,
        params.limit,
      ),
    };
  }

  private async findRow(id: string, userId: string, role?: string) {
    const [payment] = await this.dbClient.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (!payment) throw new NotFoundException('Payment not found');
    if (!this.isAdmin(role) && payment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this payment');
    }
    return payment;
  }

  async findById(id: string, userId: string, role?: string) {
    const payment = await this.findRow(id, userId, role);
    const lineItems = await this.dbClient.db
      .select()
      .from(paymentLineItems)
      .where(eq(paymentLineItems.paymentId, id));
    return this.toEntity(payment, lineItems);
  }

  async markPaid(
    id: string,
    userId: string,
    role: string | undefined,
    dto: MarkPaymentPaidDto,
  ) {
    if (!this.isAdmin(role))
      throw new ForbiddenException('Only admins can mark payments as paid');
    const payment = await this.findRow(id, userId, role);

    await this.applicationService.assertRequiredDocumentsUploaded(
      payment.applicationId,
    );

    await this.dbClient.db
      .update(payments)
      .set({
        status: 'COMPLETED',
        providerPaymentId: dto.providerPaymentId ?? payment.providerPaymentId,
        paidAt: new Date(),
      })
      .where(eq(payments.id, id));

    await this.dbClient.db
      .update(applications)
      .set({
        status: 'SUBMITTED',
        submittedAt: new Date(),
        completionPercentage: 100,
      })
      .where(eq(applications.id, payment.applicationId));

    await this.dbClient.db.insert(applicationStatusHistory).values({
      applicationId: payment.applicationId,
      fromStatus: null,
      toStatus: 'SUBMITTED',
      changedById: userId,
      note: 'Payment confirmed manually',
      isSystemChange: false,
    });

    return this.findById(id, userId, role);
  }
}
