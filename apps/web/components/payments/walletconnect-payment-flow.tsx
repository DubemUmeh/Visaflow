"use client";

import { useState } from "react";
import { BrowserProvider, parseEther } from "ethers";
import { CheckCircle2, Loader2, Wallet, XCircle } from "lucide-react";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-ethers";
import { Button } from "@/components/ui/button";

type WalletConnectPaymentFlowProps = {
  recipientAddress: string;
  amountEth?: string;
  onTransactionHash?: (txHash: string) => Promise<void> | void;
};

type PaymentState = "idle" | "signing" | "sending" | "success" | "error";

const DEFAULT_AMOUNT_ETH = "0.001";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectPaymentFlow({
  recipientAddress,
  amountEth = DEFAULT_AMOUNT_ETH,
  onTransactionHash,
}: WalletConnectPaymentFlowProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");

  const [state, setState] = useState<PaymentState>("idle");
  const [signature, setSignature] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const connect = () => open({ view: "Connect" });

  const pay = async () => {
    if (!walletProvider || !address) return;
    setError("");
    setTxHash("");
    setSignature("");

    try {
      setState("signing");
      const message = `VisaFlow payment intent: send ${amountEth} ETH to ${recipientAddress}`;
      const signed = (await walletProvider.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;
      setSignature(signed);

      setState("sending");
      const ethersProvider = new BrowserProvider(walletProvider, "any");
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

      {isConnected && address ? (
        <div className="rounded-lg bg-card p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>Connected wallet</span>
            <span className="font-mono text-foreground">{shortAddress(address)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Demo payment</span>
            <span className="font-medium text-foreground">{amountEth} ETH</span>
          </div>
          <div className="mt-2 break-all">
            <span>Recipient: </span>
            <span className="font-mono text-foreground">{recipientAddress}</span>
          </div>
        </div>
      ) : null}

      {signature ? (
        <p className="break-all rounded-lg bg-card p-3 text-xs text-muted-foreground">
          Signature: <span className="font-mono text-foreground">{signature}</span>
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
          <Button type="button" variant="brand" onClick={connect} className="gap-2">
            <Wallet className="h-4 w-4" />
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
            <Button type="button" variant="outline" onClick={() => open({ view: "Account" })}>
              Manage wallet
            </Button>
          </>
        )}
      </div>
    </div>
  );
}