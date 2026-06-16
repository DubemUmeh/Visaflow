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
  VerifyCryptoPaymentDto,
} from './dto/payment.dto';

type PaymentRow = InferModel<typeof payments>;
type LineItemRow = InferModel<typeof paymentLineItems>;
type PaymentProvider = 'STRIPE' | 'PAYPAL' | 'CRYPTO';
type CheckoutProvider = NonNullable<CreateCheckoutSessionDto['provider']>;

type PaymentWalletAddress = {
  id: string;
  label: string;
  coin: string;
  chain: string;
  address: string;
  memo?: string;
  enabled: boolean;
};

type PaymentSettings = {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  paypalEmail: string;
  paypalNarration: string;
  cryptoEnabled: boolean;
  walletConnectEnabled: boolean;
  walletConnectProjectId: string;
  walletAddresses: PaymentWalletAddress[];
};

const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const EVM_STABLECOIN_CONFIGS = [
  {
    chainMatcher: 'erc-20',
    chainId: 1,
    rpcEnvKeys: ['ETHEREUM_RPC_URL', 'EVM_RPC_URL'],
    tokenSymbol: 'USDT',
    tokenContract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
  },
  {
    chainMatcher: 'bep-20',
    chainId: 56,
    rpcEnvKeys: ['BSC_RPC_URL', 'BNB_RPC_URL'],
    tokenSymbol: 'USDT',
    tokenContract: '0x55d398326f99059ff775485246999027b3197955',
    decimals: 18,
  },
] as const;

type EvmStablecoinConfig = (typeof EVM_STABLECOIN_CONFIGS)[number];

function normalizeAddress(value: string) {
  return value.toLowerCase();
}

function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function topicAddress(value: string) {
  return `0x${value.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
}

function hexToBigInt(value: string | null | undefined) {
  if (!value || value === '0x') return 0n;
  return BigInt(value);
}

function stablecoinAmountFromCents(cents: number, decimals: number) {
  return (BigInt(cents) * 10n ** BigInt(decimals)) / 100n;
}

function getStablecoinConfig(wallet: PaymentWalletAddress) {
  const coin = wallet.coin.toUpperCase();
  const chain = wallet.chain.toLowerCase();
  return EVM_STABLECOIN_CONFIGS.find((config) =>
    //   coin === config.tokenSymbol && chain.includes(config.chainMatcher),
    chain.includes(config.chainMatcher),
  );
}

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  stripeEnabled: true,
  paypalEnabled: true,
  paypalEmail: 'payments@visaflow.com',
  paypalNarration: 'VisaFlow visa application fee',
  cryptoEnabled: true,
  walletConnectEnabled: true,
  walletConnectProjectId: '',
  walletAddresses: [
    {
      id: 'usdt-erc20',
      label: 'USDT (ERC-20)',
      coin: 'USDT',
      chain: 'Ethereum ERC-20',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      enabled: true,
    },
    {
      id: 'usdt-bep20',
      label: 'USDT (BEP-20)',
      coin: 'USDT',
      chain: 'BNB Smart Chain BEP-20',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      enabled: true,
    },
    {
      id: 'btc',
      label: 'Bitcoin',
      coin: 'BTC',
      chain: 'Bitcoin',
      address: 'bc1qvisaflowdemobtcaddress',
      enabled: true,
    },
    {
      id: 'bnb',
      label: 'BNB',
      coin: 'BNB',
      chain: 'BNB Smart Chain',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      enabled: true,
    },
  ],
};

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
      stripeEnabled: settings.stripeEnabled,
      paypalEnabled: settings.paypalEnabled && Boolean(settings.paypalEmail),
      paypalEmail: settings.paypalEmail,
      paypalNarration: settings.paypalNarration,
      cryptoEnabled: settings.cryptoEnabled,
      walletConnectEnabled:
        settings.cryptoEnabled && settings.walletConnectEnabled,
      walletConnectProjectId: settings.walletConnectProjectId,
      walletConnectReady: Boolean(settings.walletConnectProjectId),
      walletConnectError: settings.walletConnectProjectId
        ? undefined
        : 'Missing NEXT_PUBLIC_PROJECT_ID in the frontend .env.local.',
      walletConnectActiveSessions: undefined,
      walletAddresses: settings.walletAddresses.filter(
        (wallet) => wallet.enabled && wallet.address.trim().length > 0,
      ),
    };
  }

  private providerFor(provider?: CheckoutProvider): PaymentProvider {
    if (provider === 'paypal') return 'PAYPAL';
    if (
      provider === 'crypto_wallet_address' ||
      provider === 'crypto_wallet_connect'
    ) {
      return 'CRYPTO';
    }
    return 'STRIPE';
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
    const [application] = await this.dbClient.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, dto.applicationId),
          isNull(applications.deletedAt),
        ),
      )
      .limit(1);

    if (!application) throw new NotFoundException('Application not found');
    if (!this.isAdmin(role) && application.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }

    const [visaType] = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(eq(visaTypes.id, application.visaTypeId))
      .limit(1);

    if (!visaType) throw new NotFoundException('Visa type not found');

    const settings = await this.getPaymentSettings();
    const requestedProvider = dto.provider ?? 'stripe';
    const provider = this.providerFor(requestedProvider);
    const amountTotal = this.amountForTier(dto.processingTier, visaType);
    const amountGovFee = visaType.govFee;
    const amountServiceFee = Math.max(0, amountTotal - amountGovFee);
    const currency = dto.currency?.toUpperCase() ?? 'USD';
    const paymentPageUrl = `${dto.successUrl.split('/dashboard/applications/')[0]}/dashboard/payments/${application.id}`;

    if (provider === 'STRIPE' && !settings.stripeEnabled) {
      throw new ServiceUnavailableException('Stripe payments are disabled.');
    }
    if (
      provider === 'PAYPAL' &&
      (!settings.paypalEnabled || !settings.paypalEmail)
    ) {
      throw new ServiceUnavailableException(
        'PayPal payments are not configured.',
      );
    }
    if (provider === 'CRYPTO' && !settings.cryptoEnabled) {
      throw new ServiceUnavailableException(
        'Crypto payments are not configured.',
      );
    }
    if (
      requestedProvider === 'crypto_wallet_connect' &&
      (!settings.walletConnectEnabled || !settings.walletConnectProjectId)
    ) {
      throw new ServiceUnavailableException(
        'WalletConnect payments are not enabled.',
      );
    }
    if (
      (requestedProvider === 'crypto_wallet_address' ||
        requestedProvider === 'crypto_wallet_connect') &&
      !settings.walletAddresses.some(
        (wallet) => wallet.enabled && wallet.address.trim().length > 0,
      )
    ) {
      throw new ServiceUnavailableException(
        'Crypto wallet addresses are not configured.',
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
        walletId: dto.walletId,
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
        instructions: {
          paypalEmail: settings.paypalEmail,
          narration,
        },
      };
    }

    if (provider === 'CRYPTO') {
      const method = requestedProvider;

      if (method === 'crypto_wallet_connect') {
        await this.dbClient.db
          .update(payments)
          .set({ providerSessionId: payment.id })
          .where(eq(payments.id, payment.id));
      }

      return {
        sessionId: payment.id,
        paymentId: payment.id,
        provider: method,
        checkoutUrl: `${paymentPageUrl}?payment_id=${payment.id}&provider=${method}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        instructions: {
          walletConnectProjectId: settings.walletConnectProjectId,
          walletAddresses: settings.walletAddresses.filter(
            (wallet) => wallet.enabled && wallet.address.trim().length > 0,
          ),
          amount: amountTotal,
          currency,
          referenceNumber: application.referenceNumber,
        },
      };
    }

    const stripeSecret = this.configService.get<string>(
      'STRIPE_SECRET_KEY',
      '',
    );
    if (!stripeSecret) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Your application is saved as a draft; please try payment again later.',
      );
    }

    try {
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
        paymentId: payment.id,
        provider: 'stripe',
        checkoutUrl: session.url ?? dto.successUrl,
        expiresAt: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      await this.dbClient.db
        .delete(paymentLineItems)
        .where(eq(paymentLineItems.paymentId, payment.id));
      await this.dbClient.db
        .delete(payments)
        .where(eq(payments.id, payment.id));

      throw new ServiceUnavailableException(
        'Stripe checkout could not be created. Your application is saved as a draft; no payment was recorded.',
        { cause: error },
      );
    }
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

  private getRpcUrl(config: EvmStablecoinConfig) {
    for (const key of config.rpcEnvKeys) {
      const value = this.configService.get<string>(key, '');
      if (value) return value;
    }
    return '';
  }

  private async rpcCall<T>(rpcUrl: string, method: string, params: unknown[]) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Crypto RPC provider could not be reached.',
      );
    }
    const payload = (await response.json()) as { result?: T; error?: unknown };
    if (payload.error) {
      throw new ServiceUnavailableException(
        'Crypto RPC provider returned an error.',
      );
    }
    return payload.result;
  }

  private async markCryptoPaymentCompleted(params: {
    payment: PaymentRow;
    userId: string;
    txHash: string;
    metadata: Record<string, unknown>;
  }) {
    await this.dbClient.db
      .update(payments)
      .set({
        status: 'COMPLETED',
        providerPaymentId: params.txHash,
        paidAt: new Date(),
        metadata: params.metadata,
      })
      .where(eq(payments.id, params.payment.id));

    await this.dbClient.db
      .update(applications)
      .set({
        status: 'SUBMITTED',
        submittedAt: new Date(),
        completionPercentage: 100,
      })
      .where(eq(applications.id, params.payment.applicationId));

    await this.dbClient.db.insert(applicationStatusHistory).values({
      applicationId: params.payment.applicationId,
      fromStatus: null,
      toStatus: 'SUBMITTED',
      changedById: params.userId,
      note: `Crypto payment verified on-chain: ${params.txHash}`,
      isSystemChange: true,
    });
  }

  async verifyCryptoPayment(
    id: string,
    userId: string,
    role: string | undefined,
    dto: VerifyCryptoPaymentDto,
  ) {
    const payment = await this.findRow(id, userId, role);
    if (payment.provider !== 'CRYPTO') {
      throw new ForbiddenException('Only crypto payments can be verified.');
    }
    if (payment.status === 'COMPLETED') {
      return this.findById(id, userId, role);
    }

    const metadata = (payment.metadata as Record<string, unknown>) ?? {};
    if (metadata.requestedProvider !== 'crypto_wallet_connect') {
      throw new ForbiddenException(
        'This endpoint only verifies WalletConnect crypto payments.',
      );
    }

    const settings = await this.getPaymentSettings();
    const wallet = settings.walletAddresses.find(
      (item) => item.id === metadata.walletId,
    );
    if (!wallet || !wallet.enabled || !isEvmAddress(wallet.address)) {
      throw new ServiceUnavailableException(
        'Selected payment wallet is not configured for EVM verification.',
      );
    }

    const config = getStablecoinConfig(wallet);
    if (!config) {
      throw new ServiceUnavailableException(
        'WalletConnect verification currently supports configured EVM stablecoin wallets only.',
      );
    }

    const rpcUrl = this.getRpcUrl(config);
    if (!rpcUrl) {
      throw new ServiceUnavailableException(
        `Missing RPC URL for ${wallet.chain}. Configure ${config.rpcEnvKeys.join(' or ')}.`,
      );
    }

    type RpcTransaction = {
      hash: string;
      from: string;
      to: string | null;
      blockNumber: string | null;
    };
    type RpcReceipt = {
      status: string;
      to: string | null;
      logs: Array<{
        address: string;
        data: string;
        topics: string[];
      }>;
    };

    const [transaction, receipt] = await Promise.all([
      this.rpcCall<RpcTransaction>(rpcUrl, 'eth_getTransactionByHash', [
        dto.txHash,
      ]),
      this.rpcCall<RpcReceipt>(rpcUrl, 'eth_getTransactionReceipt', [
        dto.txHash,
      ]),
    ]);

    if (!transaction || !receipt || !transaction.blockNumber) {
      throw new ServiceUnavailableException(
        'Transaction is not mined yet. Please try again after confirmation.',
      );
    }
    if (receipt.status !== '0x1') {
      throw new ForbiddenException('Transaction did not succeed on-chain.');
    }
    if (normalizeAddress(transaction.to ?? '') !== config.tokenContract) {
      throw new ForbiddenException(
        `Transaction was not sent to the configured ${config.tokenSymbol} contract.`,
      );
    }

    const expectedRecipientTopic = topicAddress(wallet.address);
    const expectedAmount = stablecoinAmountFromCents(
      payment.amountTotal,
      config.decimals,
    );
    const matchingTransfer = receipt.logs.find(
      (log) =>
        normalizeAddress(log.address) === config.tokenContract &&
        normalizeAddress(log.topics[0] ?? '') === ERC20_TRANSFER_TOPIC &&
        normalizeAddress(log.topics[2] ?? '') === expectedRecipientTopic &&
        hexToBigInt(log.data) >= expectedAmount,
    );

    if (!matchingTransfer) {
      throw new ForbiddenException(
        'Transaction does not contain the expected stablecoin transfer to the VisaFlow wallet.',
      );
    }

    await this.markCryptoPaymentCompleted({
      payment,
      userId,
      txHash: dto.txHash,
      metadata: {
        ...metadata,
        cryptoVerification: {
          chainId: config.chainId,
          tokenContract: config.tokenContract,
          txHash: dto.txHash,
          verifiedAt: new Date().toISOString(),
        },
      },
    });

    return this.findById(id, userId, role);
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
