"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, Send, Wallet as WalletIcon, FileText, Shield, CreditCard
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

type WalletData = { balance: number; currency: string; depositAddress: { address: string; network: string; asset: string } };
type Transaction = { id: string; type: string; amount: number; balanceAfter: number; description: string; createdAt: string };
type ApiResponse<T> = { data: T; timestamp: string; };

export default function WalletPage() {
  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get<any>("/wallet");
      return res.data?.data ?? res.data;
    },  
  });

  const txQuery = useQuery({ 
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const res = await api.get<any>("/wallet/transactions");
      return res.data;
    }
  });

  const wallet = walletQuery.data as WalletData | undefined;
  const balanceRaw = wallet?.balance ?? 0;
  const balance = (balanceRaw / 100).toFixed(2);
  const txData = txQuery.data as any;
  const txs: Transaction[] = Array.isArray(txData)
    ? txData
    : Array.isArray(txData?.data)
    ? txData.data
    : Array.isArray(txData?.items)
    ? txData.items
    : [];

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Wallet</h1>
        <p className="mt-1 text-slate-500">Manage your balance, view transactions and fund your wallet.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr_1fr]">
        {/* Main Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <WalletIcon className="w-48 h-48 -rotate-12 translate-x-8 -translate-y-8" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-100 uppercase tracking-wider">Total Balance</span>
              <select className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm cursor-pointer">
                <option value="USD" className="text-slate-900">USD</option>
              </select>
            </div>
            
            <div className="mt-8 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">${balance}</span>
              <span className="text-lg font-medium text-blue-200 mb-1">USD</span>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-blue-200">Available to spend</span>
              <span className="text-sm font-semibold">${balance}</span>
            </div>
            
            <div className="mt-10 flex flex-wrap gap-3">
              <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold border-0 shadow-sm gap-2">
                <Plus className="w-4 h-4" /> Add Funds
              </Button>
              <Button className="bg-blue-800/40 text-white hover:bg-blue-800/60 font-semibold border-0 backdrop-blur-sm gap-2">
                <Send className="w-4 h-4" /> Send Money
              </Button>
              <Button className="bg-blue-800/40 text-white hover:bg-blue-800/60 font-semibold border-0 backdrop-blur-sm">
                Withdraw
              </Button>
            </div>
          </div>
        </div>

        {/* Wallet Overview */}
        <Card className="border-slate-200 shadow-sm flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            <h3 className="font-semibold text-slate-900 mb-6">Wallet Overview</h3>
            <div className="space-y-5 flex-1">
              <div className="flex justify-between items-center text-sm pb-5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Available Balance</span>
                <span className="font-bold text-slate-900">${balance}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Locked Balance</span>
                <span className="font-bold text-slate-900">$0.00</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Pending</span>
                <span className="font-bold text-slate-900">$0.00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Earned (This Year)</span>
                <span className="font-bold text-emerald-600">$0.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-6">Quick Actions</h3>
            <div className="space-y-4">
              {[
                { label: "Add Funds", desc: "Top up your wallet", icon: Plus },
                { label: "Send Money", desc: "Send to another user", icon: Send },
                { label: "Withdraw", desc: "Withdraw to your bank", icon: WalletIcon },
                { label: "Transaction History", desc: "View all transactions", icon: FileText }
              ].map(action => (
                <button key={action.label} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Recent Transactions Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
            <div>
              <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-semibold text-blue-700">All</button>
                <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Credits</button>
                <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Debits</button>
              </div>
            </div>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {txQuery.isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading transactions...</td></tr>
                ) : txs.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No recent transactions.</td></tr>
                ) : (
                  txs.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{t.description || "Wallet Transaction"}</p>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{t.id.substring(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={t.amount > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}>
                          {t.amount > 0 ? "Credit" : "Debit"}
                        </Badge>
                      </td>
                      <td className={`px-6 py-4 font-bold ${t.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
                        {t.amount > 0 ? "+" : ""}{(t.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-slate-100 text-slate-700 border-0 hover:bg-slate-100 font-medium">Completed</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(t.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Payment Methods</h3>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">+ Add New</button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-blue-100 bg-blue-50/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">VISA •••• 4242</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 font-bold px-2 tracking-widest">•••</button>
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Mastercard •••• 8888</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 font-bold px-2 tracking-widest">•••</button>
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-[#003087] rounded flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white italic">PayPal</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">PayPal</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 font-bold px-2 tracking-widest">•••</button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Your funds are secure</h3>
                  <p className="mt-1.5 text-xs text-blue-800/70 leading-relaxed">
                    We use bank-level encryption and security to keep your money safe.
                  </p>
                  <button className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800">Learn more &rarr;</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
