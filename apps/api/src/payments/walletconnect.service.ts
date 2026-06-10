import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type WalletKitClient = {
  getActiveSessions?: () => Record<string, unknown>;
};

type WalletConnectRuntime = {
  Core: new (options: {
    projectId: string;
    customStoragePrefix?: string;
  }) => unknown;
  WalletKit: {
    init: (options: {
      core: unknown;
      metadata: WalletConnectMetadata;
    }) => Promise<WalletKitClient>;
  };
};

type WalletConnectMetadata = {
  name: string;
  description: string;
  url: string;
  icons: string[];
  redirect?: {
    native?: string;
    universal?: string;
  };
};

type WalletConnectPaymentIntent = {
  paymentId: string;
  applicationId: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

const EIP155_METHODS = [
  'eth_accounts',
  'eth_requestAccounts',
  'eth_sendRawTransaction',
  'eth_sign',
  'eth_signTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'personal_sign',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_watchAsset',
  'wallet_sendCalls',
  'wallet_getCallsStatus',
  'wallet_showCallsStatus',
  'wallet_getCapabilities',
];

const EIP155_EVENTS = [
  'chainChanged',
  'accountsChanged',
  'message',
  'disconnect',
  'connect',
];

@Injectable()
export class WalletConnectService {
  private readonly logger = new Logger(WalletConnectService.name);
  private clientPromise?: Promise<WalletKitClient>;
  private initError?: string;

  constructor(private readonly configService: ConfigService) {}

  getProjectId(settingsProjectId?: string) {
    return (
      settingsProjectId?.trim() ||
      this.configService.get<string>('WALLETCONNECT_PROJECT_ID', '').trim()
    );
  }

  getMetadata(): WalletConnectMetadata {
    const appUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const iconUrl = this.configService.get<string>(
      'WALLETCONNECT_ICON_URL',
      '',
    );
    const nativeRedirect = this.configService.get<string>(
      'WALLETCONNECT_NATIVE_REDIRECT',
      '',
    );

    return {
      name: this.configService.get<string>('WALLETCONNECT_NAME', 'VisaFlow'),
      description: this.configService.get<string>(
        'WALLETCONNECT_DESCRIPTION',
        'VisaFlow crypto payment wallet connection',
      ),
      url: this.configService.get<string>('WALLETCONNECT_URL', appUrl),
      icons: iconUrl ? [iconUrl] : [],
      ...(nativeRedirect
        ? { redirect: { native: nativeRedirect, universal: appUrl } }
        : {}),
    };
  }

  getSupportedNamespaces() {
    const chains = this.configService
      .get<string>('WALLETCONNECT_EIP155_CHAINS', 'eip155:1,eip155:56')
      .split(',')
      .map((chain) => chain.trim())
      .filter(Boolean);

    return {
      eip155: {
        chains,
        methods: EIP155_METHODS,
        events: EIP155_EVENTS,
      },
    };
  }

  async getStatus(settingsProjectId?: string) {
    const projectId = this.getProjectId(settingsProjectId);
    if (!projectId) {
      return {
        configured: false,
        ready: false,
        projectId: '',
        activeSessions: 0,
        error:
          'Missing WALLETCONNECT_PROJECT_ID or payment settings project ID',
      };
    }

    try {
      const client = await this.getClient(projectId);
      const sessions = client.getActiveSessions?.() ?? {};

      return {
        configured: true,
        ready: true,
        projectId,
        activeSessions: Object.keys(sessions).length,
      };
    } catch (error) {
      return {
        configured: true,
        ready: false,
        projectId,
        activeSessions: 0,
        error: error instanceof Error ? error.message : 'WalletConnect failed',
      };
    }
  }

  async buildPaymentIntent(
    settingsProjectId: string | undefined,
    intent: WalletConnectPaymentIntent,
  ) {
    const status = await this.getStatus(settingsProjectId);
    if (!status.ready) {
      throw new ServiceUnavailableException(
        status.error ?? 'WalletConnect is not ready.',
      );
    }

    return {
      projectId: status.projectId,
      metadata: this.getMetadata(),
      supportedNamespaces: this.getSupportedNamespaces(),
      activeSessions: status.activeSessions,
      redirectUrl: `${intent.successUrl}${intent.successUrl.includes('?') ? '&' : '?'}payment_id=${intent.paymentId}&provider=crypto_wallet_connect`,
      payment: {
        id: intent.paymentId,
        applicationId: intent.applicationId,
        referenceNumber: intent.referenceNumber,
        amount: intent.amount,
        currency: intent.currency,
      },
    };
  }

  private async getClient(projectId: string) {
    if (!this.clientPromise) {
      this.clientPromise = this.initClient(projectId).catch(
        (error: unknown) => {
          this.initError =
            error instanceof Error ? error.message : String(error);
          this.clientPromise = undefined;
          throw error;
        },
      );
    }

    if (this.initError) this.logger.debug(this.initError);
    return this.clientPromise;
  }

  private async initClient(projectId: string) {
    const runtime = await this.loadRuntime();
    const storagePrefix = this.configService.get<string>(
      'WALLETCONNECT_STORAGE_PREFIX',
      'visaflow-payments',
    );
    const core = new runtime.Core({
      projectId,
      customStoragePrefix: storagePrefix,
    });

    return runtime.WalletKit.init({
      core,
      metadata: this.getMetadata(),
    });
  }

  private async loadRuntime(): Promise<WalletConnectRuntime> {
    try {
      const load = (specifier: string) =>
        import(specifier) as Promise<Record<string, unknown>>;
      const [{ Core }, { WalletKit }] = await Promise.all([
        load('@walletconnect/core'),
        load('@reown/walletkit'),
      ]);

      if (!Core || !WalletKit) {
        throw new Error('WalletConnect SDK exports were not found.');
      }

      return { Core, WalletKit } as WalletConnectRuntime;
    } catch (error) {
      this.logger.error('WalletConnect SDK could not be loaded', error);
      throw new ServiceUnavailableException(
        'WalletConnect SDK is not installed or could not be loaded. Run: pnpm --filter @visaflow/api add @reown/walletkit @walletconnect/utils @walletconnect/core',
      );
    }
  }
}
