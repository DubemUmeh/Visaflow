"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, CreditCard, Wallet } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import type { ApplicationEntity } from "@visaflow/shared-types";

type Provider = "wallet" | "paypal";

type PaymentOptions = {
  walletEnabled: boolean;
  paypalEnabled: boolean;
  methods: Provider[];
};

type WalletResponse = {
  data: {
    balance: number;
    currency: string;
  };
  timestamp: string;
};

export default function PaymentPage() {
  const params = useParams<{ applicationId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProvider, setSelectedProvider] = useState<Provider>("wallet");
  const processingTier = (searchParams.get("tier") ?? "STANDARD") as
    "STANDARD" | "EXPEDITED" | "RUSH";

  const application = useQuery({
    queryKey: ["payment-application", params.applicationId],
    queryFn: async () => {
      const res = await api.get(`/applications/${params.applicationId}`);
      return (res.data.data ?? res.data) as ApplicationEntity;
    },
  });

  const options = useQuery({
    queryKey: ["payment-options"],
    queryFn: async () =>
      (await api.get<PaymentOptions>("/payments/options")).data,
  });

  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get<WalletResponse>("/wallet/balance");
      return res.data.data;
    },
  });
  // console.log(wallet.data, "wallet data");

  const checkout = useMutation({
    mutationFn: async () => {
      if (selectedProvider === "wallet") {
        return (
          await api.post("/wallet/pay", {
            applicationId: params.applicationId,
            processingTier,
          })
        ).data as { paymentId: string };
      }
      return (
        await api.post("/payments/checkout", {
          applicationId: params.applicationId,
          processingTier,
          provider: "paypal",
          successUrl: `${window.location.origin}/dashboard/applications/${params.applicationId}`,
          cancelUrl: window.location.href,
        })
      ).data as { checkoutUrl: string };
    },
    onSuccess: (data) => {
      if ("checkoutUrl" in data) window.location.href = data.checkoutUrl;
      else router.push(`/dashboard/applications/${params.applicationId}`);
    },
  });

  const canPay = application.data?.canPay ?? false;

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
      {application.data && !canPay && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Application not ready for payment
            </CardTitle>
            <CardDescription className="text-amber-800">
              Complete the required application steps before payment can be
              initiated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-amber-900">
            {application.data.missingRequirements.length > 0 && (
              <div>
                <p className="font-medium">Please complete:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {application.data.missingRequirements.map((requirement) => (
                    <li key={requirement}>{requirement.replace(/_/g, " ")}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              type="button"
              variant="brand"
              onClick={() =>
                router.push(
                  `/dashboard/applications/new?continue=${params.applicationId}`,
                )
              }
            >
              Continue Application
            </Button>
          </CardContent>
        </Card>
      )}
      {wallet.data && canPay && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet balance</CardTitle>
            <CardDescription>
              Available for instant visa payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {(wallet.data.balance / 100).toFixed(2)} {wallet.data.currency}
          </CardContent>
        </Card>
      )}
      {canPay && (
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
      )}
      {checkout.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {checkout.error instanceof Error
            ? checkout.error.message
            : "Payment failed"}
        </p>
      )}
      <Button
        size="lg"
        disabled={
          checkout.isPending ||
          options.isLoading ||
          application.isLoading ||
          !canPay
        }
        onClick={() => checkout.mutate()}
      >
        {checkout.isPending
          ? "Processing..."
          : selectedProvider === "wallet"
            ? "Pay with wallet"
            : "Continue to PayPal"}
      </Button>
    </div>
  );
}
