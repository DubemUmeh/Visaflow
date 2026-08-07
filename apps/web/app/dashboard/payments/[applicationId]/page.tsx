"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Provider = "wallet" | "paypal";
type ApiEnvelope<T> = { data: T };

type PaymentOptions = {
  walletEnabled: boolean;
  paypalEnabled: boolean;
  methods: Provider[];
};

type WalletBalance = { balance: number; currency: string };

function unwrap<T>(payload: T | ApiEnvelope<T>): T {
  return payload && typeof payload === "object" && "data" in payload
    ? (payload as ApiEnvelope<T>).data
    : (payload as T);
}

export default function PaymentPage() {
  const params = useParams<{ applicationId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProvider, setSelectedProvider] = useState<Provider>("wallet");
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const processingTier = (searchParams.get("tier") ?? "STANDARD") as
    "STANDARD" | "EXPEDITED" | "RUSH";

  const options = useQuery({
    queryKey: ["payment-options"],
    queryFn: async () =>
      unwrap(
        (
          await api.get<PaymentOptions | ApiEnvelope<PaymentOptions>>(
            "/payments/options",
          )
        ).data,
      ),
  });
  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: async () =>
      unwrap(
        (
          await api.get<WalletBalance | ApiEnvelope<WalletBalance>>(
            "/wallet/balance",
          )
        ).data,
      ),
  });
  const walletBalance = Number.isFinite(Number(wallet.data?.balance))
    ? Number(wallet.data?.balance)
    : 0;
  const walletCurrency = wallet.data?.currency ?? "USD";

  const checkout = useMutation({
    mutationFn: async () => {
      if (selectedProvider === "wallet") {
        return unwrap(
          (
            await api.post("/wallet/pay", {
              applicationId: params.applicationId,
              processingTier,
            })
          ).data,
        ) as { paymentId: string };
      }
      return unwrap(
        (
          await api.post("/payments/checkout", {
            applicationId: params.applicationId,
            processingTier,
            provider: "paypal",
            successUrl: `${window.location.origin}/dashboard/applications/${params.applicationId}`,
            cancelUrl: window.location.href,
          })
        ).data,
      ) as { checkoutUrl: string };
    },
    onSuccess: (data) => {
      if ("checkoutUrl" in data) window.location.href = data.checkoutUrl;
      else router.push(`/dashboard/applications/${params.applicationId}`);
    },
    onError: (error) => {
      const responseMessage = (
        error as AxiosError<{ message?: string | string[] }>
      )?.response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join(" ")
        : (responseMessage ?? (error instanceof Error ? error.message : ""));
      if (
        selectedProvider === "wallet" &&
        message.toLowerCase().includes("insufficient")
      )
        setShowTopUpModal(true);
    },
  });

  const methods = useMemo(
    () => [
      {
        provider: "wallet" as const,
        title: "Wallet",
        description: "Pay instantly from your internal VisaFlow balance.",
        icon: Wallet,
        enabled: options.data?.walletEnabled ?? true,
      },
      {
        provider: "paypal" as const,
        title: "PayPal",
        description: "Continue to PayPal checkout.",
        icon: CreditCard,
        enabled: options.data?.paypalEnabled ?? false,
      },
    ],
    [options.data],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Pay for your visa</h1>
        <p className="text-muted-foreground">
          Choose Wallet or PayPal. Wallet is the primary payment method.
        </p>
      </div>
      {wallet.data && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet balance</CardTitle>
            <CardDescription>
              Available for instant visa payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {(walletBalance / 100).toFixed(2)} {walletCurrency}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const selected = selectedProvider === method.provider;
          return (
            <button
              key={method.provider}
              type="button"
              disabled={!method.enabled}
              onClick={() => setSelectedProvider(method.provider)}
              className={`rounded-xl border p-5 text-left transition ${selected ? "border-primary bg-primary/5" : "border-border"} ${!method.enabled ? "opacity-50" : ""}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <Icon className="h-6 w-6" />
                {selected && <Badge>Selected</Badge>}
              </div>
              <h2 className="font-semibold">{method.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {method.description}
              </p>
            </button>
          );
        })}
      </div>
      {checkout.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {checkout.error instanceof Error
            ? checkout.error.message
            : "Payment failed"}
        </p>
      )}
      <Button
        size="lg"
        disabled={checkout.isPending || options.isLoading}
        onClick={() => checkout.mutate()}
      >
        {checkout.isPending
          ? "Processing..."
          : selectedProvider === "wallet"
            ? "Pay with wallet"
            : "Continue to PayPal"}
      </Button>
      <AlertDialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Top up your wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Your wallet balance is not enough for this visa payment. Add funds
              to your wallet, then return here to pay instantly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay here</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/dashboard/wallet")}>
              Go to wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
