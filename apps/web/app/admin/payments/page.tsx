"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, RefreshCw, Save, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import { toast } from "sonner";
import type { PaymentEntity } from "@visaflow/shared-types";

type WalletAddress = { id: string; label: string; coin: string; chain: string; address: string; memo?: string; enabled: boolean };
type PaymentSettings = { walletEnabled: boolean; paypalEnabled: boolean; paypalEmail: string; paypalNarration: string; walletNetwork: string; walletAddresses: WalletAddress[] };

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/payments?limit=50"), api.get("/admin/settings")])
      .then(([paymentRes, settingsRes]) => {
        setPayments(paymentRes.data.data?.data ?? paymentRes.data.data?.items ?? []);
        setSettings(settingsRes.data.data?.payments ?? null);
      })
      .catch(() => toast.error("Unable to load payments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateWallet = (id: string, patch: Partial<WalletAddress>) => {
    setSettings((current) => current ? { ...current, walletAddresses: current.walletAddresses.map((wallet) => wallet.id === id ? { ...wallet, ...patch } : wallet) } : current);
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.patch("/admin/settings", { payments: settings });
      toast.success("Payment provider settings saved");
      load();
    } catch {
      toast.error("Unable to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (payment: PaymentEntity) => {
    setUpdatingId(payment.id);
    try {
      await api.patch(`/payments/${payment.id}/mark-paid`, { providerPaymentId: payment.id });
      toast.success("Payment marked as paid");
      load();
    } catch {
      toast.error("Could not update payment");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Payments</h1><p className="mt-1 text-muted-foreground">Enable, disable, and edit Wallet and PayPal payment details.</p></div>
        <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-brand" /> Provider configuration</CardTitle></CardHeader>
        <CardContent>
          {!settings ? <div className="py-8 text-center text-sm text-muted-foreground">No payment settings loaded.</div> : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {([
                  ["walletEnabled", "Wallet"],
                  ["paypalEnabled", "PayPal"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-2xl border border-border/70 p-4 text-sm font-medium">
                    <Checkbox checked={Boolean(settings[key])} onCheckedChange={(value) => setSettings({ ...settings, [key]: Boolean(value) })} /> {label}
                  </label>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input label="PayPal email" value={settings.paypalEmail} onChange={(e) => setSettings({ ...settings, paypalEmail: e.target.value })} />
                <Input label="PayPal narration" value={settings.paypalNarration} onChange={(e) => setSettings({ ...settings, paypalNarration: e.target.value })} />
                <Input label="Internal wallet network" value={settings.walletNetwork ?? "ethereum-sepolia"} onChange={(e) => setSettings({ ...settings, walletNetwork: e.target.value })} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Internal deposit settings</p>
                {settings.walletAddresses.map((wallet) => (
                  <div key={wallet.id} className="grid gap-3 rounded-2xl border border-border/70 p-4 md:grid-cols-[0.7fr_0.7fr_1.4fr_auto]">
                    <Input label="Label" value={wallet.label} onChange={(e) => updateWallet(wallet.id, { label: e.target.value })} />
                    <Input label="Chain" value={wallet.chain} onChange={(e) => updateWallet(wallet.id, { chain: e.target.value })} />
                    <Input label="Address" value={wallet.address} onChange={(e) => updateWallet(wallet.id, { address: e.target.value })} />
                    <label className="flex items-end gap-2 pb-2 text-sm"><Checkbox checked={wallet.enabled} onCheckedChange={(value) => updateWallet(wallet.id, { enabled: Boolean(value) })} /> Enabled</label>
                  </div>
                ))}
              </div>
              <Button variant="brand" onClick={saveSettings} isLoading={saving} className="gap-2"><Save className="h-4 w-4" /> Save payment settings</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment attempts</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div> : payments.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">No payment attempts yet.</div> : (
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-3 pr-4">Payment</th><th className="py-3 pr-4">Provider</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Created</th><th className="py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-border">{payments.map((payment, index) => <motion.tr key={payment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}><td className="py-3 pr-4"><p className="font-mono text-xs text-foreground">{payment.id}</p><p className="text-xs text-muted-foreground">Application {payment.applicationId}</p></td><td className="py-3 pr-4">{payment.provider}</td><td className="py-3 pr-4 font-semibold">{formatMoney(payment.amountTotal, payment.currency)}</td><td className="py-3 pr-4"><Badge>{payment.status}</Badge></td><td className="py-3 pr-4 text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</td><td className="py-3 text-right">{payment.status === "COMPLETED" ? <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Paid</span> : <Button size="sm" variant="brand" onClick={() => markPaid(payment)} isLoading={updatingId === payment.id}>Mark paid</Button>}</td></motion.tr>)}</tbody></table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
