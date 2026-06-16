"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, parseEther, type Eip1193Provider } from "ethers";
import { CheckCircle2, Loader2, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getUniversalConnector,
  walletConnectChainId,
} from "@/lib/walletconnect-config";
import type { UniversalConnector } from "@reown/appkit-universal-connector";

type WalletConnectPaymentFlowProps = {
  recipientAddress: string;
  amountEth?: string;
  onTransactionHash?: (txHash: string) => Promise<void> | void;
};

type PaymentState =
  | "idle"
  | "connecting"
  | "signing"
  | "sending"
  | "success"
  | "error";

type WalletConnectSession = {
  namespaces?: Record<string, { accounts?: string[] }>;
};

const DEFAULT_AMOUNT_ETH = "0.001";

function getAddressFromSession(session?: WalletConnectSession | null) {
  const caipAccount = session?.namespaces?.eip155?.accounts?.[0];
  return caipAccount?.split(":").at(-1) ?? "";
}

function asEip1193Provider(connector: UniversalConnector): Eip1193Provider {
  return {
    request: ({ method, params }) =>
      connector.request(
        { method, params: params as unknown[] | undefined },
        walletConnectChainId,
      ) as Promise<unknown>,
  };
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectPaymentFlow({
  recipientAddress,
  amountEth = DEFAULT_AMOUNT_ETH,
  onTransactionHash,
}: WalletConnectPaymentFlowProps) {
  const [connector, setConnector] = useState<UniversalConnector>();
  const [session, setSession] = useState<WalletConnectSession | null>(null);
  const [state, setState] = useState<PaymentState>("idle");
  const [signature, setSignature] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const address = useMemo(() => getAddressFromSession(session), [session]);
  const isConnected = Boolean(address);

  useEffect(() => {
    let mounted = true;
    getUniversalConnector()
      .then((instance) => {
        if (!mounted) return;
        setConnector(instance);
        setSession(instance.provider.session as WalletConnectSession | null);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "WalletConnect failed to initialize.",
        );
        setState("error");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const connect = async () => {
    if (!connector) return;
    setError("");
    setState("connecting");
    try {
      const { session: providerSession } = await connector.connect();
      setSession(providerSession as WalletConnectSession);
      setState("idle");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Wallet connection was cancelled.",
      );
      setState("error");
    }
  };

  const disconnect = async () => {
    if (!connector) return;
    await connector.disconnect();
    setSession(null);
    setSignature("");
    setTxHash("");
    setError("");
    setState("idle");
  };

  const pay = async () => {
    if (!connector || !address) return;
    setError("");
    setTxHash("");
    setSignature("");

    try {
      setState("signing");
      const message = `VisaFlow payment intent: send ${amountEth} ETH to ${recipientAddress}`;
      const signed = (await connector.request(
        { method: "personal_sign", params: [message, address] },
        walletConnectChainId,
      )) as string;
      setSignature(signed);

      setState("sending");
      const ethersProvider = new BrowserProvider(asEip1193Provider(connector));
      const signer = await ethersProvider.getSigner(address);
      const transaction = await signer.sendTransaction({
        to: recipientAddress,
        value: parseEther(amountEth),
      });
      setTxHash(transaction.hash);
      await onTransactionHash?.(transaction.hash);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet payment failed.");
      setState("error");
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
      <div>
        <p className="font-semibold">Pay with WalletConnect</p>
        <p className="mt-1 text-blue-900/80">
          Connect MetaMask, Trust Wallet, OKX, Bitget, or another WalletConnect
          wallet, sign a payment intent, then approve the transaction.
        </p>
      </div>

      {isConnected ? (
        <div className="rounded-lg bg-card p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>Connected wallet</span>
            <span className="font-mono text-foreground">
              {shortAddress(address)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Demo payment</span>
            <span className="font-medium text-foreground">{amountEth} ETH</span>
          </div>
          <div className="mt-2 break-all">
            <span>Recipient: </span>
            <span className="font-mono text-foreground">
              {recipientAddress}
            </span>
          </div>
        </div>
      ) : null}

      {signature ? (
        <p className="break-all rounded-lg bg-card p-3 text-xs text-muted-foreground">
          Signature:{" "}
          <span className="font-mono text-foreground">{signature}</span>
        </p>
      ) : null}

      {txHash ? (
        <p className="break-all rounded-lg bg-green-50 p-3 text-xs text-green-800">
          Transaction hash: <span className="font-mono">{txHash}</span>
        </p>
      ) : null}

      {error ? (
        <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {!isConnected ? (
          <Button
            type="button"
            variant="brand"
            onClick={connect}
            disabled={!connector || state === "connecting"}
            className="gap-2"
          >
            {state === "connecting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            Pay with WalletConnect
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="brand"
              onClick={pay}
              disabled={state === "signing" || state === "sending"}
              className="gap-2"
            >
              {state === "signing" || state === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {state === "signing"
                ? "Confirm signature…"
                : state === "sending"
                  ? "Approve transaction…"
                  : "Pay"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={disconnect}
              disabled={state === "signing" || state === "sending"}
            >
              Disconnect
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
