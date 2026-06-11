"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Upload,
  Wallet,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";
import type { ApplicationEntity, PaymentEntity } from "@visaflow/shared-types";

type PaymentProvider =
  | "stripe"
  | "paypal"
  | "crypto_wallet_connect"
  | "crypto_wallet_address";
type WalletAddress = {
  id: string;
  label: string;
  coin: string;
  chain: string;
  address: string;
  memo?: string;
  enabled: boolean;
};

type PaymentOptions = {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  paypalEmail: string;
  paypalNarration: string;
  cryptoEnabled: boolean;
  walletConnectEnabled: boolean;
  walletConnectProjectId: string;
  walletAddresses: WalletAddress[];
};

const providerCards: Array<{
  provider: PaymentProvider;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    provider: "stripe",
    title: "Stripe",
    description: "Pay securely by card through Stripe Checkout.",
    icon: CreditCard,
  },
  {
    provider: "paypal",
    title: "PayPal",
    description: "Open PayPal with the exact fee and narration pre-filled.",
    icon: WalletCards,
  },
  {
    provider: "crypto_wallet_connect",
    title: "WalletConnect (manual fallback)",
    description:
      "Use the same configured crypto wallet addresses until the frontend wallet modal is implemented.",
    icon: Wallet,
  },
  {
    provider: "crypto_wallet_address",
    title: "Wallet address",
    description: "Send crypto manually to one of the configured addresses.",
    icon: Wallet,
  },
];

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100,
  );
}

function amountForTier(
  application: ApplicationEntity,
  tier: "STANDARD" | "EXPEDITED" | "RUSH",
) {
  if (tier === "EXPEDITED")
    return (
      application.visaType.priceExpedited ??
      Math.round(application.visaType.priceStandard * 1.5)
    );
  if (tier === "RUSH")
    return (
      application.visaType.priceRush ??
      Math.round(application.visaType.priceStandard * 2.5)
    );
  return application.visaType.priceStandard;
}

export default function PaymentPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const tier = (search.get("tier") ?? "STANDARD") as
    | "STANDARD"
    | "EXPEDITED"
    | "RUSH";
  const [application, setApplication] = useState<ApplicationEntity | null>(
    null,
  );
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider>("stripe");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/applications/${applicationId}`),
      api.get("/payments/options"),
      api.get(`/payments?applicationId=${applicationId}&limit=20`),
    ])
      .then(([appRes, optionsRes, paymentsRes]) => {
        setApplication(appRes.data.data);
        setOptions(optionsRes.data.data);
        setPayments(
          paymentsRes.data.data?.data ?? paymentsRes.data.data?.items ?? [],
        );
        const firstWallet =
          optionsRes.data.data?.walletAddresses?.[0]?.id ?? "";
        setSelectedWalletId(firstWallet);
        const loadedOptions = optionsRes.data.data as PaymentOptions;
        const firstEnabledProvider = providerCards.find((card) => {
          if (card.provider === "stripe") return loadedOptions.stripeEnabled;
          if (card.provider === "paypal") return loadedOptions.paypalEnabled;
          if (card.provider === "crypto_wallet_connect") {
            return (
              loadedOptions.cryptoEnabled &&
              loadedOptions.walletConnectEnabled &&
              loadedOptions.walletAddresses.length > 0
            );
          }
          return (
            loadedOptions.cryptoEnabled &&
            loadedOptions.walletAddresses.length > 0
          );
        });
        if (firstEnabledProvider)
          setSelectedProvider(firstEnabledProvider.provider);
      })
      .catch(() => {
        toast.error("Unable to load payment details");
        router.push(`/dashboard/applications/${applicationId}`);
      })
      .finally(() => setLoading(false));
  }, [applicationId, router]);

  const enabledProviders = useMemo(() => {
    if (!options) return [];
    return providerCards.filter((card) => {
      if (card.provider === "stripe") return options.stripeEnabled;
      if (card.provider === "paypal") return options.paypalEnabled;
      if (card.provider === "crypto_wallet_connect") {
        return (
          options.cryptoEnabled &&
          options.walletConnectEnabled &&
          options.walletAddresses.length > 0
        );
      }
      return options.cryptoEnabled && options.walletAddresses.length > 0;
    });
  }, [options]);

  const selectedWallet = options?.walletAddresses.find(
    (wallet) => wallet.id === selectedWalletId,
  );
  const amount = application ? amountForTier(application, tier) : 0;
  const latestPayment = payments[0];

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const createCheckout = async () => {
    if (!application) return;
    setPaying(true);
    try {
      const origin = window.location.origin;
      const { data } = await api.post("/payments/checkout", {
        applicationId,
        processingTier: tier,
        currency: "USD",
        successUrl: `${origin}/dashboard/applications/${applicationId}`,
        cancelUrl: `${origin}/dashboard/payments/${applicationId}?tier=${tier}`,
        provider: selectedProvider,
        walletId:
          selectedProvider === "crypto_wallet_address" ||
          selectedProvider === "crypto_wallet_connect"
            ? selectedWalletId
            : undefined,
      });
      if (selectedProvider === "crypto_wallet_connect") {
        toast.info(
          "WalletConnect is using the manual wallet address fallback until the frontend wallet modal is implemented.",
        );
      }
      window.location.assign(data.data.checkoutUrl);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Payment could not be started";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setPaying(false);
    }
  };

  const uploadProof = async (file: File) => {
    setUploading(true);
    try {
      const upload = await api.post("/documents/upload-url", {
        applicationId,
        documentType: "OTHER",
        fileName: `payment-proof-${file.name}`,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      await api.post("/documents/confirm", {
        documentId: upload.data.data.documentId,
        storageKey: upload.data.data.fields?.storageKey,
      });
      toast.success("Payment proof uploaded for admin review");
    } catch {
      toast.error("Could not upload payment proof");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!application || !options) return null;

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href={`/dashboard/applications/${applicationId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80"
      >
        <ArrowLeft className="h-4 w-4" /> Back to application
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Choose payment method</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your application is saved. Payment can be completed now or proof
                can be uploaded for manual review if anything goes wrong.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {enabledProviders.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No payment method is enabled yet. Please contact support.
                </div>
              ) : (
                enabledProviders.map((card) => (
                  <button
                    type="button"
                    key={card.provider}
                    onClick={() => setSelectedProvider(card.provider)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedProvider === card.provider ? "border-brand bg-brand-soft" : "border-border hover:border-brand/50"}`}
                  >
                    <div className="flex items-start gap-3">
                      <card.icon className="mt-0.5 h-5 w-5 text-brand" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {card.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                      {selectedProvider === card.provider && (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                    </div>
                  </button>
                ))
              )}

              {selectedProvider === "paypal" && (
                <div className="rounded-xl bg-sand/60 p-4 text-sm">
                  <p className="font-medium text-foreground">
                    PayPal recipient
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 font-mono text-xs">
                    <span>{options.paypalEmail}</span>
                    <button
                      type="button"
                      onClick={() => copy(options.paypalEmail, "PayPal email")}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {(selectedProvider === "crypto_wallet_address" ||
                selectedProvider === "crypto_wallet_connect") && (
                <div className="space-y-3 rounded-xl bg-sand/60 p-4 text-sm">
                  <label className="font-medium text-foreground">
                    Choose coin / chain
                  </label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  >
                    {options.walletAddresses.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.label} · {wallet.chain}
                      </option>
                    ))}
                  </select>
                  {selectedWallet && (
                    <div className="rounded-lg bg-card p-3">
                      <p className="text-xs text-muted-foreground">
                        Send exactly {formatMoney(amount, "USD")} equivalent and
                        include reference {application.referenceNumber}.
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 break-all font-mono text-xs">
                        <span>{selectedWallet.address}</span>
                        <button
                          type="button"
                          onClick={() =>
                            copy(selectedWallet.address, "Wallet address")
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      {selectedWallet.memo && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Memo/tag: {selectedWallet.memo}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedProvider === "crypto_wallet_connect" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-medium">Manual crypto fallback</p>
                  <p className="mt-1">
                    VisaFlow does not start WalletConnect sessions from the
                    backend. Until AppKit is wired into this page, use the
                    selected wallet address above and upload proof for admin
                    review.
                  </p>
                </div>
              )}

              <Button
                variant="brand"
                size="lg"
                onClick={createCheckout}
                isLoading={paying}
                disabled={enabledProviders.length === 0}
                className="w-full gap-2"
              >
                <CreditCard className="h-4 w-4" /> Continue with selected method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Upload proof
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                If PayPal or crypto payment needs manual confirmation, upload a
                screenshot or receipt for admin review.
              </p>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center hover:border-brand/60">
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {uploading ? "Uploading…" : "Choose payment proof file"}
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, image, or receipt screenshot
                </span>
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) =>
                    e.target.files?.[0] && uploadProof(e.target.files[0])
                  }
                />
              </label>
            </CardContent>
          </Card>
        </motion.div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application</span>
                <span className="font-mono">{application.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visa</span>
                <span className="font-medium">{application.visaType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing</span>
                <Badge variant="secondary">{tier}</Badge>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-bold">
                <span>Total due</span>
                <span>{formatMoney(amount, "USD")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {latestPayment ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge>{latestPayment.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider</span>
                    <span>{latestPayment.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span>
                      {formatMoney(
                        latestPayment.amountTotal,
                        latestPayment.currency,
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 rounded-xl bg-sand/60 p-3 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" /> No payment
                  attempt yet.
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
