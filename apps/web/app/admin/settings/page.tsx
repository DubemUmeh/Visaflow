"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Save,
  CheckCircle2,
  WalletCards,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

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

const defaultPaymentSettings: PaymentSettings = {
  stripeEnabled: true,
  paypalEnabled: false,
  paypalEmail: "payments@visaflow.com",
  paypalNarration: "VisaFlow visa application fee",
  cryptoEnabled: false,
  walletConnectEnabled: false,
  walletConnectProjectId: "",
  walletAddresses: [
    {
      id: "usdt-erc20",
      label: "USDT (ERC-20)",
      coin: "USDT",
      chain: "Ethereum ERC-20",
      address: "",
      enabled: true,
    },
    {
      id: "usdt-bep20",
      label: "USDT (BEP-20)",
      coin: "USDT",
      chain: "BNB Smart Chain BEP-20",
      address: "",
      enabled: true,
    },
    {
      id: "btc",
      label: "Bitcoin",
      coin: "BTC",
      chain: "Bitcoin",
      address: "",
      enabled: true,
    },
    {
      id: "bnb",
      label: "BNB",
      coin: "BNB",
      chain: "BNB Smart Chain",
      address: "",
      enabled: true,
    },
  ],
};

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${checked ? "bg-brand" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow transition-transform ${checked ? "translate-x-4" : "translate-x-1"}`}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    newApplicationEmail: true,
    statusChangeEmail: true,
    weeklyDigest: false,
    slackIntegration: false,
  });
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerify: true,
    autoAssignApplications: false,
  });
  const [general, setGeneral] = useState({
    siteName: "VisaFlow",
    supportEmail: "support@visaflow.com",
    defaultTimezone: "UTC",
    defaultLanguage: "en",
  });
  const [payments, setPayments] = useState(defaultPaymentSettings);

  const updateWallet = (id: string, patch: Partial<PaymentWalletAddress>) => {
    setPayments((current) => ({
      ...current,
      walletAddresses: current.walletAddresses.map((wallet) =>
        wallet.id === id ? { ...wallet, ...patch } : wallet,
      ),
    }));
  };

  const addWallet = () => {
    const id = `wallet-${Date.now()}`;
    setPayments((current) => ({
      ...current,
      walletAddresses: [
        ...current.walletAddresses,
        {
          id,
          label: "New wallet",
          coin: "",
          chain: "",
          address: "",
          enabled: true,
        },
      ],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/admin/settings", {
        general,
        notifications: notificationSettings,
        system: systemSettings,
        payments,
      });
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    api
      .get("/admin/settings")
      .then(({ data }) => {
        if (data.data?.general) setGeneral(data.data.general);
        if (data.data?.notifications)
          setNotificationSettings(data.data.notifications);
        if (data.data?.system) setSystemSettings(data.data.system);
        if (data.data?.payments)
          setPayments({ ...defaultPaymentSettings, ...data.data.payments });
      })
      .catch(() => {});
  }, []);

  const sections = [
    {
      key: "general",
      title: "General",
      icon: Globe,
      content: (
        <div className="space-y-4">
          {[
            {
              label: "Site Name",
              key: "siteName",
              type: "text",
              placeholder: "VisaFlow",
            },
            {
              label: "Support Email",
              key: "supportEmail",
              type: "email",
              placeholder: "support@example.com",
            },
            {
              label: "Default Timezone",
              key: "defaultTimezone",
              type: "text",
              placeholder: "UTC",
            },
            {
              label: "Default Language",
              key: "defaultLanguage",
              type: "text",
              placeholder: "en",
            },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {field.label}
              </label>
              <input
                type={field.type}
                value={general[field.key as keyof typeof general]}
                onChange={(e) =>
                  setGeneral((p) => ({ ...p, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "payments",
      title: "Payments",
      icon: WalletCards,
      content: (
        <div className="space-y-6">
          {[
            {
              key: "stripeEnabled",
              label: "Stripe checkout",
              desc: "Keep card checkout available.",
            },
            {
              key: "paypalEnabled",
              label: "PayPal payment link",
              desc: "Show PayPal as a hosted payment option.",
            },
            {
              key: "cryptoEnabled",
              label: "Crypto payments",
              desc: "Enable wallet address and WalletConnect flows.",
            },
            {
              key: "walletConnectEnabled",
              label: "WalletConnect",
              desc: "Allow connected wallets once a project ID is configured.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
              <Toggle
                checked={Boolean(payments[item.key as keyof typeof payments])}
                onChange={(v) => setPayments((p) => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                PayPal email
              </label>
              <input
                type="email"
                value={payments.paypalEmail}
                onChange={(e) =>
                  setPayments((p) => ({ ...p, paypalEmail: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                WalletConnect project ID
              </label>
              <input
                value={payments.walletConnectProjectId}
                onChange={(e) =>
                  setPayments((p) => ({
                    ...p,
                    walletConnectProjectId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">
              PayPal narration
            </label>
            <input
              value={payments.paypalNarration}
              onChange={(e) =>
                setPayments((p) => ({ ...p, paypalNarration: e.target.value }))
              }
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Crypto wallet addresses
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWallet}
              >
                Add wallet
              </Button>
            </div>
            {payments.walletAddresses.map((wallet) => (
              <div
                key={wallet.id}
                className="rounded-xl border border-border p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    value={wallet.label}
                    onChange={(e) =>
                      updateWallet(wallet.id, { label: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-card"
                    placeholder="USDT (ERC-20)"
                  />
                  <Toggle
                    checked={wallet.enabled}
                    onChange={(enabled) => updateWallet(wallet.id, { enabled })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    value={wallet.coin}
                    onChange={(e) =>
                      updateWallet(wallet.id, { coin: e.target.value })
                    }
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-card"
                    placeholder="Coin"
                  />
                  <input
                    value={wallet.chain}
                    onChange={(e) =>
                      updateWallet(wallet.id, { chain: e.target.value })
                    }
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-card"
                    placeholder="Chain"
                  />
                  <input
                    value={wallet.memo ?? ""}
                    onChange={(e) =>
                      updateWallet(wallet.id, { memo: e.target.value })
                    }
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-card"
                    placeholder="Memo/tag"
                  />
                </div>
                <input
                  value={wallet.address}
                  onChange={(e) =>
                    updateWallet(wallet.id, { address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card font-mono"
                  placeholder="Wallet address"
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "notifications",
      title: "Notifications",
      icon: Bell,
      content: (
        <div className="space-y-4">
          {[
            {
              key: "newApplicationEmail",
              label: "New application email alerts",
              desc: "Get notified when a new application is submitted",
            },
            {
              key: "statusChangeEmail",
              label: "Status change notifications",
              desc: "Email when application status changes",
            },
            {
              key: "weeklyDigest",
              label: "Weekly digest",
              desc: "Summary of all activity every Monday",
            },
            {
              key: "slackIntegration",
              label: "Slack integration",
              desc: "Send notifications to a Slack channel",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
              <Toggle
                checked={
                  notificationSettings[
                    item.key as keyof typeof notificationSettings
                  ]
                }
                onChange={(v) =>
                  setNotificationSettings((p) => ({ ...p, [item.key]: v }))
                }
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "system",
      title: "System",
      icon: Settings,
      content: (
        <div className="space-y-4">
          {[
            {
              key: "maintenanceMode",
              label: "Maintenance Mode",
              desc: "Take site offline for maintenance",
              danger: true,
            },
            {
              key: "allowNewRegistrations",
              label: "Allow New Registrations",
              desc: "Let new users sign up",
              danger: false,
            },
            {
              key: "requireEmailVerify",
              label: "Require Email Verification",
              desc: "New accounts must verify email",
              danger: false,
            },
            {
              key: "autoAssignApplications",
              label: "Auto-assign Applications",
              desc: "Automatically assign to available agents",
              danger: false,
            },
          ].map((item) => (
            <div
              key={item.key}
              className={`flex items-center justify-between py-2 ${item.danger && systemSettings.maintenanceMode && item.key === "maintenanceMode" ? "text-destructive" : ""}`}
            >
              <div>
                <p
                  className={`text-sm font-medium ${item.danger && systemSettings[item.key as keyof typeof systemSettings] ? "text-destructive" : "text-foreground"}`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
              <Toggle
                checked={
                  systemSettings[item.key as keyof typeof systemSettings]
                }
                onChange={(v) =>
                  setSystemSettings((p) => ({ ...p, [item.key]: v }))
                }
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "security",
      title: "Security",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-brand-soft rounded-xl border border-brand-soft">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand">
                  Security Status: Good
                </p>
                <p className="text-xs text-brand mt-0.5">
                  All security features are properly configured.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure system-wide preferences.
          </p>
        </div>
        <Button
          variant="brand"
          onClick={handleSave}
          isLoading={saving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save All
        </Button>
      </div>

      {sections.map((section, i) => (
        <motion.div
          key={section.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <section.icon className="w-4 h-4 text-muted-foreground/70" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">{section.content}</CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
