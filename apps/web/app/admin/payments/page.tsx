"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, RefreshCw, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";
import type { PaymentEntity } from "@visaflow/shared-types";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100,
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPayments = () => {
    setLoading(true);
    api
      .get("/payments?limit=50")
      .then(({ data }) =>
        setPayments(data.data?.data ?? data.data?.items ?? []),
      )
      .catch(() => toast.error("Unable to load payments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const markPaid = async (payment: PaymentEntity) => {
    setUpdatingId(payment.id);
    try {
      await api.patch(`/payments/${payment.id}/mark-paid`, {
        providerPaymentId: payment.id,
      });
      toast.success("Payment marked as paid");
      loadPayments();
    } catch {
      toast.error("Could not update payment");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Review initiated payments, manual crypto/PayPal proof, and payment
            status.
          </p>
        </div>
        <Button variant="outline" onClick={loadPayments} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-brand" /> Payment attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No payment attempts yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Payment</th>
                    <th className="py-3 pr-4">Provider</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <td className="py-3 pr-4">
                        <p className="font-mono text-xs text-foreground">
                          {payment.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Application {payment.applicationId}
                        </p>
                      </td>
                      <td className="py-3 pr-4">{payment.provider}</td>
                      <td className="py-3 pr-4 font-semibold">
                        {formatMoney(payment.amountTotal, payment.currency)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge>{payment.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        {payment.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                            <CheckCircle2 className="h-4 w-4" /> Paid
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="brand"
                            onClick={() => markPaid(payment)}
                            isLoading={updatingId === payment.id}
                          >
                            Mark paid
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
