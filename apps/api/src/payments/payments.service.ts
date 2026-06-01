import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  and,
  desc,
  eq,
  isNull,
  sql,
  type InferModel,
} from 'drizzle-orm';
import {
  applications,
  paymentLineItems,
  payments,
  visaTypes,
} from '@visaflow/database';
import Stripe from 'stripe';
import type { PaymentEntity, PaymentSummary } from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
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

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dbClient: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private toIso(value: Date | string | null | undefined) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
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
      return visaType.priceExpedited ?? Math.round(visaType.priceStandard * 1.5);
    }
    if (tier === 'RUSH') {
      return visaType.priceRush ?? Math.round(visaType.priceStandard * 2.5);
    }
    return visaType.priceStandard;
  }

  async createCheckout(
    userId: string,
    role: string | undefined,
    dto: CreateCheckoutSessionDto,
  ) {
    const [application] = await this.dbClient.db
      .select()
      .from(applications)
      .where(
        and(eq(applications.id, dto.applicationId), isNull(applications.deletedAt)),
      )
      .limit(1);

    if (!application) throw new NotFoundException('Application not found');
    if (!this.isAdmin(role) && application.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    const [visaType] = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(eq(visaTypes.id, application.visaTypeId))
      .limit(1);

    if (!visaType) throw new NotFoundException('Visa type not found');

    const amountTotal = this.amountForTier(dto.processingTier, visaType);
    const amountGovFee = visaType.govFee;
    const amountServiceFee = Math.max(0, amountTotal - amountGovFee);
    const provider = dto.provider === 'paypal' ? 'PAYPAL' : 'STRIPE';

    const [payment] = await this.dbClient.db
      .insert(payments)
      .values({
        userId,
        applicationId: application.id,
        status: 'PENDING',
        provider,
        amountTotal,
        amountGovFee,
        amountServiceFee,
        amountTax: 0,
        amountRefunded: 0,
        currency: dto.currency?.toUpperCase() ?? 'USD',
        processingTier: dto.processingTier,
        description: `${visaType.name} application ${application.referenceNumber}`,
        metadata: {
          successUrl: dto.successUrl,
          cancelUrl: dto.cancelUrl,
        },
      })
      .returning();

    if (!payment) throw new NotFoundException('Payment could not be created');

    await this.dbClient.db.insert(paymentLineItems).values({
      paymentId: payment.id,
      description: `${visaType.name} (${dto.processingTier.toLowerCase()})`,
      quantity: 1,
      unitAmount: amountTotal,
      totalAmount: amountTotal,
      currency: payment.currency,
      metadata: { applicationId: application.id, visaTypeId: visaType.id },
    });

    const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    if (stripeSecret) {
      const stripe = new Stripe(stripeSecret);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: payment.currency.toLowerCase(),
              unit_amount: amountTotal,
              product_data: {
                name: `${visaType.name} visa application`,
                description: `VisaFlow application ${application.referenceNumber}`,
              },
            },
          },
        ],
        success_url: `${dto.successUrl}${dto.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&payment_id=${payment.id}`,
        cancel_url: `${dto.cancelUrl}${dto.cancelUrl.includes('?') ? '&' : '?'}payment_id=${payment.id}`,
        metadata: {
          paymentId: payment.id,
          applicationId: application.id,
          userId,
          referenceNumber: application.referenceNumber,
        },
      });

      await this.dbClient.db
        .update(payments)
        .set({ providerSessionId: session.id })
        .where(eq(payments.id, payment.id));

      return {
        sessionId: session.id,
        checkoutUrl: session.url ?? dto.successUrl,
        expiresAt: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    }

    const checkoutUrl = `${dto.successUrl}${dto.successUrl.includes('?') ? '&' : '?'}payment_id=${payment.id}`;

    return {
      sessionId: payment.id,
      checkoutUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
      this.isAdmin(params.role) ? undefined : eq(payments.userId, params.userId),
      params.applicationId ? eq(payments.applicationId, params.applicationId) : undefined,
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
      this.dbClient.db.select({ count: sql`count(*)` }).from(payments).where(where),
    ]);

    return {
      data: rows.map((row) => this.toSummary(row)),
      meta: buildPaginationMeta(Number(countRows[0]?.count ?? 0), params.page, params.limit),
    };
  }

  async findById(id: string, userId: string, role?: string) {
    const [payment] = await this.dbClient.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (!payment) throw new NotFoundException('Payment not found');
    if (!this.isAdmin(role) && payment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    const lines = await this.dbClient.db
      .select()
      .from(paymentLineItems)
      .where(eq(paymentLineItems.paymentId, payment.id));

    return this.toEntity(payment, lines);
  }

  async markPaid(id: string, userId: string, role: string | undefined, dto: MarkPaymentPaidDto) {
    if (!this.isAdmin(role)) {
      throw new ForbiddenException('Only admins can mark payments as paid');
    }

    await this.findById(id, userId, role);

    await this.dbClient.db
      .update(payments)
      .set({
        status: 'COMPLETED',
        paidAt: new Date(),
        providerPaymentId: dto.providerPaymentId,
      })
      .where(eq(payments.id, id));

    return this.findById(id, userId, role);
  }
}
