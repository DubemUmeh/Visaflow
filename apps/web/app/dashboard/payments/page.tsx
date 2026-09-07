"use client";

import React, { useEffect, useState } from "react";
import { Download, CreditCard, CheckCircle, Clock, RotateCcw, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import dayjs from "dayjs";

type PaymentEntity = {
  id: string;
  amountTotal: number;
  amountRefunded?: number;
  currency: string;
  provider: string;
  status: string;
  description?: string;
  createdAt: string;
};

function StatCard({ label, value, note, icon: Icon, tone }: { label: string, value: string | number, note: string, icon: any, tone?: 'green' | 'orange' | 'purple' }) {
  const colorClass = 
    tone === 'green' ? 'text-emerald-600 bg-emerald-50' : 
    tone === 'orange' ? 'text-orange-600 bg-orange-50' : 
    tone === 'purple' ? 'text-purple-600 bg-purple-50' : 
    'text-blue-600 bg-blue-50';

  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{note}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Successful</Badge>;
    case 'PENDING':
    case 'PROCESSING':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">Pending</Badge>;
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0">Refunded</Badge>;
    case 'FAILED':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0">Failed</Badge>;
    default:
      return <Badge variant="outline" className="text-slate-600 border-slate-200">{status}</Badge>;
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    api.get("/payments?limit=50")
      .then(res => {
        setPayments(getResponseItems<PaymentEntity>(res.data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = payments.reduce((sum, p) => p.status === 'COMPLETED' ? sum + (p.amountTotal || 0) : sum, 0);
  const successfulCount = payments.filter(p => p.status === 'COMPLETED').length;
  const pendingCount = payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length;
  const totalRefunded = payments.reduce((sum, p) => p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED' ? sum + (p.amountRefunded || p.amountTotal || 0) : sum, 0);

  const filteredPayments = payments.filter(p => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Successful") return p.status === "COMPLETED";
    if (statusFilter === "Pending") return p.status === "PENDING" || p.status === "PROCESSING";
    if (statusFilter === "Failed") return p.status === "FAILED";
    if (statusFilter === "Refunded") return p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
        <p className="mt-1 text-slate-500">View your payment history, download receipts and track your transactions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Paid" value={`$${(totalPaid / 100).toFixed(2)}`} note="All time" icon={CreditCard} />
        <StatCard label="Successful Payments" value={successfulCount} note="All time" icon={CheckCircle} tone="green" />
        <StatCard label="Pending Payments" value={pendingCount} note="Total" icon={Clock} tone="orange" />
        <StatCard label="Refunds Received" value={`$${(totalRefunded / 100).toFixed(2)}`} note="All time" icon={RotateCcw} tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_315px]">
        {/* Main Content */}
        <Card className="overflow-hidden border-slate-200 flex flex-col">
          <div className="flex flex-wrap items-center gap-7 border-b border-slate-100 px-6 pt-5 bg-white text-sm">
            <button 
              onClick={() => setStatusFilter("All")}
              className={`pb-4 font-semibold whitespace-nowrap transition-colors ${statusFilter === "All" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              All Transactions
            </button>
            {["Successful", "Pending", "Failed", "Refunded"].map(x => (
              <button 
                key={x} 
                onClick={() => setStatusFilter(x)}
                className={`pb-4 font-medium whitespace-nowrap transition-colors ${statusFilter === x ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-700"}`}
              >
                {x}
              </button>
            ))}
            <div className="ml-auto pb-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> Download Statement
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading payments...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No payment history found.</td></tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{(p.id || '').substring(0, 16)}...</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.description || "Visa Application Fee"}</td>
                      <td className={`px-6 py-4 font-semibold ${p.status === 'REFUNDED' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {p.status === 'REFUNDED' ? '+' : '-'}${(p.amountTotal / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{p.provider || "WALLET"}</td>
                      <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {dayjs(p.createdAt).format('MMM D, YYYY · h:mm A')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-center gap-2 border-t border-slate-100 p-4 text-sm bg-white mt-auto">
            <button className="px-3 py-1 text-slate-400 hover:text-slate-600">‹</button>
            <button className="rounded-md border border-blue-600 bg-blue-50 px-3 py-1 font-semibold text-blue-700">1</button>
            <button className="px-3 py-1 text-slate-600 hover:text-blue-600">2</button>
            <button className="px-3 py-1 text-slate-600 hover:text-blue-600">3</button>
            <button className="px-3 py-1 text-slate-400">…</button>
            <button className="px-3 py-1 text-slate-600 hover:text-blue-600">10</button>
            <button className="px-3 py-1 text-slate-600 hover:text-blue-600">›</button>
          </div>
        </Card>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-900">Spending Overview</h3>
                <select className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 bg-white">
                  <option>This Year</option>
                  <option>All Time</option>
                </select>
              </div>
              
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-slate-900">${(totalPaid / 100).toFixed(2)}</p>
              
              <div className="mt-8 h-32 border-b border-slate-200 bg-gradient-to-t from-blue-50/50 to-white flex items-end justify-between px-2 pb-1 relative">
                {/* Decorative simple bar chart representation */}
                {[40, 70, 30, 90, 60, 100, 50, 80].map((h, i) => (
                  <div key={i} className="w-4 bg-blue-600 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                ))}
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-blue-600" /> Applications</span>
                  <span className="font-medium text-slate-900">${(totalPaid / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Wallet Funding</span>
                  <span className="font-medium text-slate-900">$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-purple-500" /> Refunds</span>
                  <span className="font-medium text-slate-900">${(totalRefunded / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-1 -mx-2">
                {["Make a Payment", "Add Funds to Wallet", "Download Statement", "View Refunds"].map(x => (
                  <button key={x} className="w-full flex justify-between items-center px-3 py-3 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors group">
                    <span className="font-medium">{x}</span>
                    <span className="text-slate-400 group-hover:text-blue-600 transition-colors">›</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card className="bg-blue-50/50 border-blue-100 overflow-hidden">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 text-base">Secure Payments</h3>
            <p className="mt-1 text-sm text-blue-800/70 leading-relaxed">
              Your payments are protected with bank-level security and AES-256 encryption. Visaflow does not store your credit card information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
