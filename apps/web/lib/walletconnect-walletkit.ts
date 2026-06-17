"use client";

import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import api from "@/lib/api";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

type WalletKitClient = Awaited<ReturnType<typeof WalletKit.init>>;
type SessionProposal = {
  id: number;
  params: Parameters<typeof buildApprovedNamespaces>[0]["proposal"];
};
type SessionRequest = {
  id: number;
  topic: string;
  params: { request: { method: string; params?: unknown[] } };
};

type WalletKitPaymentConfig = {
  accounts: string[];
  chains?: string[];
  methods?: string[];
  events?: string[];
  verifyPaymentPath?: (txHash: string) => string;
  onTransactionHash?: (txHash: string) => Promise<void> | void;
  onSessionApproved?: (session: {
    peer: { metadata: { url?: string } };
  }) => void;
};

const DEFAULT_CHAINS = ["eip155:1"];
const DEFAULT_METHODS = ["eth_sendTransaction", "personal_sign"];
const DEFAULT_EVENTS = ["accountsChanged", "chainChanged"];

let walletKitPromise: Promise<WalletKitClient> | undefined;
let activeConfig: WalletKitPaymentConfig | undefined;
let listenersRegistered = false;

function getProjectId() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_PROJECT_ID in .env.local.");
  }
  return projectId;
}

function getBrowserWallet() {
  if (!window.ethereum) {
    throw new Error(
      "No browser wallet found to approve WalletConnect requests.",
    );
  }
  return window.ethereum;
}

function handleRedirect(session: { peer: { metadata: { url?: string } } }) {
  const url = session.peer.metadata.url;
  if (url && window.opener) {
    window.opener.location.href = url;
    window.close();
  }
}

async function sendTransactionHash(txHash: string) {
  if (activeConfig?.onTransactionHash) {
    await activeConfig.onTransactionHash(txHash);
    return;
  }

  const path = activeConfig?.verifyPaymentPath?.(txHash);
  if (path) {
    await api.post(path, { txHash });
  }
}

async function approveSession(
  walletKit: WalletKitClient,
  proposal: SessionProposal,
) {
  if (!activeConfig?.accounts.length) {
    await walletKit.rejectSession({
      id: proposal.id,
      reason: getSdkError("USER_REJECTED"),
    });
    throw new Error(
      "Select a receiving wallet before approving WalletConnect.",
    );
  }

  const approvedNamespaces = buildApprovedNamespaces({
    proposal: proposal.params,
    supportedNamespaces: {
      eip155: {
        chains: activeConfig.chains ?? DEFAULT_CHAINS,
        methods: activeConfig.methods ?? DEFAULT_METHODS,
        events: activeConfig.events ?? DEFAULT_EVENTS,
        accounts: activeConfig.accounts,
      },
    },
  });

  const session = await walletKit.approveSession({
    id: proposal.id,
    namespaces: approvedNamespaces,
  });
  activeConfig.onSessionApproved?.(session);
  handleRedirect(session);
}

async function respondToRequest(
  walletKit: WalletKitClient,
  event: SessionRequest,
) {
  const { topic, params, id } = event;
  const { request } = params;
  const wallet = window.ethereum as Eip1193Provider;

  try {
    const result = await wallet.request({
      method: request.method,
      params: request.params as unknown[],
    });

    await walletKit.respondSessionRequest({
      topic,
      response: { id, result, jsonrpc: "2.0" },
    });

    if (
      request.method === "eth_sendTransaction" &&
      typeof result === "string"
    ) {
      await sendTransactionHash(result);
    }
  } catch (error) {
    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: "2.0",
        error: {
          code: 5000,
          message:
            error instanceof Error ? error.message : "Wallet request failed",
        },
      },
    });
    throw error;
  }
}

function registerListeners(walletKit: WalletKitClient) {
  if (listenersRegistered) return;
  listenersRegistered = true;
  walletKit.on("session_proposal", (proposal) => {
    void approveSession(walletKit, proposal as SessionProposal);
  });
  walletKit.on("session_request", (event) => {
    void respondToRequest(walletKit, event as SessionRequest);
  });
}

export async function getWalletKit(config?: WalletKitPaymentConfig) {
  if (config) activeConfig = config;
  if (!walletKitPromise) {
    const core = new Core({ projectId: getProjectId() });
    walletKitPromise = WalletKit.init({
      core,
      metadata: {
        name: "VisaFlow",
        description: "Accept crypto payments",
        url: window.location.origin,
        icons: [],
      },
    });
  }

  const walletKit = await walletKitPromise;
  registerListeners(walletKit);
  return walletKit;
}

export async function pairWalletConnectUri(
  uri: string,
  config: WalletKitPaymentConfig,
) {
  const walletKit = await getWalletKit(config);
  await walletKit.pair({ uri });
}
