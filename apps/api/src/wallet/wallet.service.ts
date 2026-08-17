import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql, type InferModel } from 'drizzle-orm';
import {
  applicationStatusHistory,
  applications,
  deposits,
  paymentEvents,
  paymentLineItems,
  payments,
  visaTypes,
  walletAddresses,
  wallets,
  walletTransactions,
} from '@visaflow/database';
import { DatabaseService } from '../common/database/database.service';
import { ApplicationService } from '../application/application.service';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import type {
  DepositWebhookDto,
  ListWalletTransactionsDto,
  PayWithWalletDto,
} from './dto/wallet.dto';

type WalletRow = InferModel<typeof wallets>;
const NETWORK = 'ethereum-sepolia';
const ASSET = 'USDT';
const REQUIRED_CONFIRMATIONS = 12;

@Injectable()
export class WalletService {
  constructor(
    private readonly dbClient: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly applicationService: ApplicationService,
    private readonly realtimeService: RealtimeService,
  ) {}

  private async notify(
    userId: string,
    type: string,
    subject: string,
    body: string,
    payload: Record<string, unknown> = {},
  ) {
    await this.notificationsService.createSystemNotification({
      userId,
      channel: 'IN_APP',
      recipient: userId,
      subject,
      body,
    });
    this.realtimeService.emit(userId, type, { subject, body, ...payload });
  }

  async getOrCreateWallet(userId: string) {
    const [existing] = await this.dbClient.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);
    if (existing) return existing;
    const [wallet] = await this.dbClient.db
      .insert(wallets)
      .values({ userId, updatedAt: new Date() })
      .returning();
    if (!wallet) throw new NotFoundException('Wallet could not be created');
    return wallet;
  }

  async getWallet(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const address = await this.getDepositAddress(userId);
    return {
      id: wallet.id,
      userId,
      balance: wallet.balance,
      currency: wallet.currency,
      depositAddress: address,
    };
  }

  async getDepositAddress(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const [existing] = await this.dbClient.db
      .select()
      .from(walletAddresses)
      .where(
        and(
          eq(walletAddresses.walletId, wallet.id),
          eq(walletAddresses.network, NETWORK),
        ),
      )
      .limit(1);
    if (existing) return existing;
    const seed = wallet.id.replaceAll('-', '').slice(0, 40).padEnd(40, '0');
    const [address] = await this.dbClient.db
      .insert(walletAddresses)
      .values({
        walletId: wallet.id,
        userId,
        network: NETWORK,
        asset: ASSET,
        address: `0x${seed}`,
      })
      .returning();
    if (!address)
      throw new NotFoundException('Deposit address could not be created');
    return address;
  }

  async listTransactions(userId: string, query: ListWalletTransactionsDto) {
    const wallet = await this.getOrCreateWallet(userId);
    const { skip, take } = buildPaginationSkipTake(
      query.page ?? 1,
      query.limit ?? 20,
    );
    const where = eq(walletTransactions.walletId, wallet.id);
    const [rows, countRows] = await Promise.all([
      this.dbClient.db
        .select()
        .from(walletTransactions)
        .where(where)
        .orderBy(desc(walletTransactions.createdAt))
        .limit(take)
        .offset(skip),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(walletTransactions)
        .where(where),
    ]);
    return {
      data: rows,
      meta: buildPaginationMeta(
        Number(countRows[0]?.count ?? 0),
        query.page ?? 1,
        query.limit ?? 20,
      ),
    };
  }

  async listDeposits(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return this.dbClient.db
      .select()
      .from(deposits)
      .where(eq(deposits.walletId, wallet.id))
      .orderBy(desc(deposits.createdAt));
  }

  private async recordTransaction(
    wallet: WalletRow,
    amount: number,
    type: 'DEPOSIT' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT',
    description: string,
    referenceType?: string,
    referenceId?: string,
  ) {
    const nextBalance = wallet.balance + amount;
    if (nextBalance < 0)
      throw new BadRequestException('Insufficient wallet balance');
    const [updated] = await this.dbClient.db
      .update(wallets)
      .set({ balance: nextBalance, updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id))
      .returning();
    const [transaction] = await this.dbClient.db
      .insert(walletTransactions)
      .values({
        walletId: wallet.id,
        userId: wallet.userId,
        type,
        amount,
        balanceAfter: nextBalance,
        currency: wallet.currency,
        referenceType,
        referenceId,
        description,
      })
      .returning();
    return {
      wallet: updated ?? { ...wallet, balance: nextBalance },
      transaction,
    };
  }

  async handleDepositWebhook(dto: DepositWebhookDto) {
    const network = dto.network ?? NETWORK;
    const asset = dto.asset ?? ASSET;
    const [address] = await this.dbClient.db
      .select()
      .from(walletAddresses)
      .where(
        and(
          eq(walletAddresses.network, network),
          eq(walletAddresses.address, dto.recipient),
        ),
      )
      .limit(1);
    if (!address) throw new NotFoundException('Deposit address not assigned');
    const [duplicate] = await this.dbClient.db
      .select()
      .from(deposits)
      .where(
        and(
          eq(deposits.network, network),
          eq(deposits.transactionHash, dto.transactionHash),
        ),
      )
      .limit(1);
    if (duplicate) return duplicate;
    const wallet = await this.getOrCreateWallet(address.userId);
    const confirmed = dto.confirmations >= REQUIRED_CONFIRMATIONS;
    const [deposit] = await this.dbClient.db
      .insert(deposits)
      .values({
        walletId: wallet.id,
        userId: wallet.userId,
        walletAddressId: address.id,
        transactionHash: dto.transactionHash,
        network,
        asset,
        amount: dto.amount,
        confirmations: dto.confirmations,
        status: confirmed ? 'CONFIRMED' : 'PENDING',
        confirmedAt: confirmed ? new Date() : null,
        updatedAt: new Date(),
      })
      .returning();
    if (confirmed && deposit) {
      const { transaction } = await this.recordTransaction(
        wallet,
        dto.amount,
        'DEPOSIT',
        `${asset} deposit confirmed`,
        'deposit',
        deposit.id,
      );
      await this.dbClient.db
        .update(deposits)
        .set({ creditedTransactionId: transaction?.id, updatedAt: new Date() })
        .where(eq(deposits.id, deposit.id));
      await this.notify(
        wallet.userId,
        'deposit.confirmed',
        'Deposit confirmed',
        `Your ${asset} deposit has been confirmed and credited.`,
        { depositId: deposit.id, amount: dto.amount },
      );
    }
    return deposit;
  }

  async payWithWallet(
    userId: string,
    role: string | undefined,
    dto: PayWithWalletDto,
  ) {
    const [application] = await this.dbClient.db
      .select()
      .from(applications)
      .where(eq(applications.id, dto.applicationId))
      .limit(1);
    if (!application) throw new NotFoundException('Application not found');
    if (
      role !== 'ADMIN' &&
      role !== 'SUPER_ADMIN' &&
      application.userId !== userId
    )
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    await this.applicationService.assertRequiredDocumentsUploaded(
      application.id,
    );
    const [visaType] = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(eq(visaTypes.id, application.visaTypeId))
      .limit(1);
    if (!visaType) throw new NotFoundException('Visa type not found');
    const amountTotal =
      dto.processingTier === 'RUSH'
        ? (visaType.priceRush ?? Math.round(visaType.priceStandard * 2.5))
        : dto.processingTier === 'EXPEDITED'
          ? (visaType.priceExpedited ??
            Math.round(visaType.priceStandard * 1.5))
          : visaType.priceStandard;
    const wallet = await this.getOrCreateWallet(application.userId);
    if (wallet.balance < amountTotal)
      throw new BadRequestException('Insufficient wallet balance');
    const [payment] = await this.dbClient.db
      .insert(payments)
      .values({
        userId: application.userId,
        applicationId: application.id,
        status: 'COMPLETED',
        provider: 'WALLET',
        amountTotal,
        amountGovFee: visaType.govFee,
        amountServiceFee: Math.max(0, amountTotal - visaType.govFee),
        amountTax: 0,
        amountRefunded: 0,
        currency: wallet.currency,
        processingTier: dto.processingTier,
        description: `${visaType.name} application ${application.referenceNumber}`,
        paidAt: new Date(),
        metadata: { source: 'internal_wallet' },
      })
      .returning();

    console.log({
      walletBalance: wallet.balance,
      amountTotal,
      processingTier: dto.processingTier,
      walletCurrency: wallet.currency,
      applicationId: application.id,
      applicationUserId: application.userId,
      currentUserId: userId,
      visaType: {
        id: visaType.id,
        name: visaType.name,
        priceStandard: visaType.priceStandard,
        priceExpedited: visaType.priceExpedited,
        priceRush: visaType.priceRush,
        govFee: visaType.govFee,
      },
    });
    // Stashed change
    // if (wallet.balance < amountTotal) throw new BadRequestException('Insufficient wallet balance');
    // const [payment] = await this.dbClient.db.insert(payments).values({ userId: application.userId, applicationId: application.id, status: 'COMPLETED', provider: 'WALLET', amountTotal, amountGovFee: visaType.govFee, amountServiceFee: Math.max(0, amountTotal - visaType.govFee), amountTax: 0, amountRefunded: 0, currency: wallet.currency, processingTier: dto.processingTier, description: `${visaType.name} application ${application.referenceNumber}`, paidAt: new Date(), metadata: { source: 'internal_wallet' } }).returning();

    if (!payment) throw new NotFoundException('Payment could not be created');
    await this.dbClient.db.insert(paymentLineItems).values({
      paymentId: payment.id,
      description: `${visaType.name} (${dto.processingTier.toLowerCase()})`,
      quantity: 1,
      unitAmount: amountTotal,
      totalAmount: amountTotal,
      currency: wallet.currency,
      metadata: {},
    });
    await this.recordTransaction(
      wallet,
      -amountTotal,
      'PAYMENT',
      `Visa application payment ${application.referenceNumber}`,
      'payment',
      payment.id,
    );
    await this.dbClient.db
      .update(applications)
      .set({
        status: 'SUBMITTED',
        submittedAt: new Date(),
        completionPercentage: 100,
      })
      .where(eq(applications.id, application.id));
    await this.dbClient.db.insert(applicationStatusHistory).values({
      applicationId: application.id,
      fromStatus: application.status,
      toStatus: 'SUBMITTED',
      changedById: application.userId,
      note: 'Paid with internal wallet',
      isSystemChange: true,
    });
    await this.dbClient.db.insert(paymentEvents).values({
      userId: application.userId,
      paymentId: payment.id,
      applicationId: application.id,
      eventType: 'application.paid',
      payload: { provider: 'wallet', amountTotal },
    });
    await this.notify(
      application.userId,
      'application.paid',
      'Application paid',
      `Your application ${application.referenceNumber} was paid from your wallet.`,
      { paymentId: payment.id, applicationId: application.id },
    );
    return { paymentId: payment.id, status: payment.status };
  }
}
