"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Send,
  Wallet as WalletIcon,
  FileText,
  Shield,
  CreditCard,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import { formatCurrency } from "@/lib/utils";

type WalletData = {
  balance: number;
  currency: string;
  depositAddress: { address: string; network: string; asset: string };
};
type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
};

const PAYMENT_METHODS = [
  {
    label: "VISA •••• 4242",
    brand: "VISA",
    tone: "text-blue-600",
    primary: true,
  },
  {
    label: "Mastercard •••• 8888",
    brand: "MC",
    tone: "text-orange-500",
    primary: false,
  },
  { label: "PayPal", brand: "PP", tone: "text-[#003087]", primary: false },
];

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
    },
  });

  const wallet = walletQuery.data as WalletData | undefined;
  const balanceRaw = wallet?.balance ?? 0;
  const balance = formatCurrency(balanceRaw, wallet?.currency);
  const txs: Transaction[] = getResponseItems<Transaction>(txQuery.data);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Wallet
        </h1>
        <p className="mt-1 text-slate-500">
          Manage your balance, view transactions, and fund your wallet.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Main balance card */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-8 text-white shadow-lg">
          <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-10">
            <WalletIcon className="h-48 w-48 -translate-y-8 translate-x-8 -rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-wider text-blue-100">
                Total balance
              </span>
              <Select defaultValue="USD">
                <SelectTrigger className="h-8 w-21 border-white/20 bg-white/10 text-xs text-white backdrop-blur-sm focus:ring-white/50 [&>svg]:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">
                {balance}
              </span>
              <span className="mb-1 text-lg font-medium text-blue-200">
                USD
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-blue-200">Available to spend</span>
              <span className="text-sm font-semibold">{balance}</span>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button className="gap-2 border-0 bg-white font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
                <Plus className="h-4 w-4" /> Add funds
              </Button>
              <Button className="gap-2 border-0 bg-blue-800/40 font-semibold text-white backdrop-blur-sm hover:bg-blue-800/60">
                <Send className="h-4 w-4" /> Send money
              </Button>
              <Button className="border-0 bg-blue-800/40 font-semibold text-white backdrop-blur-sm hover:bg-blue-800/60">
                Withdraw
              </Button>
            </div>
          </div>
        </div>

        {/* Wallet overview */}
        {/* <Card className="flex flex-col border-slate-200/80 shadow-sm">
          <CardContent className="flex flex-1 flex-col p-6">
            <h3 className="mb-6 font-semibold text-slate-900">
              Wallet overview
            </h3>
            <div className="flex-1 space-y-5">
              {[
                ["Available balance", `$${balance}`, "text-slate-900"],
                ["Locked balance", "$0.00", "text-slate-900"],
                ["Pending", "$0.00", "text-slate-900"],
              ].map(([label, val, cls]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between border-b border-slate-100 pb-5 text-sm"
                >
                  <span className="font-medium text-slate-500">{label}</span>
                  <span className={`font-bold ${cls}`}>{val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500">
                  Total earned (this year)
                </span>
                <span className="font-bold text-emerald-600">$0.00</span>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Quick actions */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-6 font-semibold text-slate-900">Quick actions</h3>
            <div className="space-y-4">
              {[
                { label: "Add funds", desc: "Top up your wallet", icon: Plus },
                {
                  label: "Send money",
                  desc: "Send to another user",
                  icon: Send,
                },
                {
                  label: "Withdraw",
                  desc: "Withdraw to your bank",
                  icon: WalletIcon,
                },
                {
                  label: "Transaction history",
                  desc: "View all transactions",
                  icon: FileText,
                },
              ].map((action) => (
                <button
                  key={action.label}
                  className="group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {action.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Recent transactions */}
        <Card className="flex flex-col overflow-hidden border-slate-200/80 py-0 gap-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h3 className="font-semibold text-slate-900">
                Recent transactions
              </h3>
              <Tabs defaultValue="all" className="mt-4 gap-0">
                <TabsList className="h-auto gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="all"
                    className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-none data-[state=active]:border-blue-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="credits"
                    className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-none data-[state=active]:border-blue-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
                  >
                    Credits
                  </TabsTrigger>
                  <TabsTrigger
                    value="debits"
                    className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-none data-[state=active]:border-blue-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
                  >
                    Debits
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="pl-6">Transaction</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : txs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-slate-500"
                  >
                    No recent transactions.
                  </TableCell>
                </TableRow>
              ) : (
                txs.slice(0, 5).map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50/60">
                    <TableCell className="pl-6">
                      <p className="font-semibold text-slate-900">
                        {t.description || "Wallet Transaction"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {t.id.substring(0, 8)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.amount > 0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }
                      >
                        {t.amount > 0 ? "Credit" : "Debit"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`font-bold ${t.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}
                    >
                      {t.amount > 0 ? "+" : ""}
                      {formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className="border-0 bg-slate-100 font-medium text-slate-700 hover:bg-slate-100">
                        Completed
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-xs font-medium text-slate-500">
                      {new Date(t.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Payment methods
                </h3>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Add new
                </Button>
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <div
                    key={m.label}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                      m.primary
                        ? "border-blue-100 bg-blue-50/30"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-10 rounded border border-slate-200 bg-white">
                        <AvatarFallback
                          className={`rounded text-[10px] font-bold ${m.tone}`}
                        >
                          {m.brand === "PP" ? (
                            <span className="italic">PayPal</span>
                          ) : m.brand === "MC" ? (
                            <CreditCard className="h-4 w-4" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-700">
                        {m.label}
                      </span>
                      {m.primary && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-blue-200 bg-white text-[10px] text-blue-600"
                        >
                          <Star className="h-2.5 w-2.5 fill-blue-600" /> Default
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-600"
                          aria-label="Card options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem>Set as default</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Your funds are secure
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-blue-800/70">
                    We use bank-level encryption and security to keep your money
                    safe.
                  </p>
                  <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800">
                    Learn more <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
