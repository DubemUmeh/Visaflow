"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  RotateCcw,
  Shield,
  ChevronRight,
  Wallet,
  Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis } from "recharts";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import { formatCurrency } from "@/lib/utils";
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

type WalletData = {
  balance: number;
  currency: string;
};

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: any;
  tone?: "green" | "orange" | "purple";
}) {
  const colorClass =
    tone === "green"
      ? "text-emerald-600 bg-emerald-50"
      : tone === "orange"
        ? "text-orange-600 bg-orange-50"
        : tone === "purple"
          ? "text-purple-600 bg-purple-50"
          : "text-blue-600 bg-blue-50";

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{note}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    COMPLETED: {
      cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      label: "Successful",
    },
    PENDING: {
      cls: "bg-orange-100 text-orange-700 hover:bg-orange-100",
      label: "Pending",
    },
    PROCESSING: {
      cls: "bg-orange-100 text-orange-700 hover:bg-orange-100",
      label: "Pending",
    },
    REFUNDED: {
      cls: "bg-purple-100 text-purple-700 hover:bg-purple-100",
      label: "Refunded",
    },
    PARTIALLY_REFUNDED: {
      cls: "bg-purple-100 text-purple-700 hover:bg-purple-100",
      label: "Refunded",
    },
    FAILED: {
      cls: "bg-rose-100 text-rose-700 hover:bg-rose-100",
      label: "Failed",
    },
  };
  const m = map[status];
  if (m) return <Badge className={`border-0 ${m.cls}`}>{m.label}</Badge>;
  return (
    <Badge variant="outline" className="border-slate-200 text-slate-600">
      {status}
    </Badge>
  );
}

const SPARK_DATA = [40, 70, 30, 90, 60, 100, 50, 80].map((v, i) => ({
  month: i,
  amount: v,
}));

// shadcn chart config: drives the --color-amount CSS var + legend/tooltip label
const spendChartConfig = {
  amount: {
    label: "Spend",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("All");

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get<any>("/payments?limit=50");
      return res.data;
    },
  });

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get<any>("/wallet");
      return res.data?.data ?? res.data;
    },
  });

  const wallet = walletQuery.data as WalletData | undefined;
  const balanceRaw = wallet?.balance ?? 0;
  const balance = formatCurrency(balanceRaw, wallet?.currency);

  const payments: PaymentEntity[] = getResponseItems<PaymentEntity>(
    paymentsQuery.data,
  );
  const loading = paymentsQuery.isLoading;

  const totalPaid = payments.reduce(
    (sum, p) => (p.status === "COMPLETED" ? sum + (p.amountTotal || 0) : sum),
    0,
  );
  const successfulCount = payments.filter(
    (p) => p.status === "COMPLETED",
  ).length;
  const pendingCount = payments.filter((p) =>
    ["PENDING", "PROCESSING"].includes(p.status),
  ).length;
  const totalRefunded = payments.reduce(
    (sum, p) =>
      ["REFUNDED", "PARTIALLY_REFUNDED"].includes(p.status)
        ? sum + (p.amountRefunded || p.amountTotal || 0)
        : sum,
    0,
  );

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Successful") return p.status === "COMPLETED";
    if (statusFilter === "Pending")
      return ["PENDING", "PROCESSING"].includes(p.status);
    if (statusFilter === "Failed") return p.status === "FAILED";
    if (statusFilter === "Refunded")
      return ["REFUNDED", "PARTIALLY_REFUNDED"].includes(p.status);
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Payments
        </h1>
        <p className="mt-1 text-slate-500">
          View your payment history, download receipts, and track transactions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total paid"
          value={formatCurrency(totalPaid)}
          note="All time"
          icon={CreditCard}
        />
        <StatCard
          label="Successful payments"
          value={successfulCount}
          note="All time"
          icon={CheckCircle}
          tone="green"
        />
        <StatCard
          label="Pending payments"
          value={pendingCount}
          note="Total"
          icon={Clock}
          tone="orange"
        />
        <StatCard
          label="Refunds received"
          value={formatCurrency(totalRefunded)}
          note="All time"
          icon={RotateCcw}
          tone="purple"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_315px]">
        {/* Main content */}
        <Card className="flex flex-col overflow-hidden border-slate-200/80 py-0 gap-0 shadow-sm">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="gap-0"
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 pt-4">
              <TabsList className="h-auto justify-start gap-1 rounded-none bg-transparent p-0">
                {["All", "Successful", "Pending", "Failed", "Refunded"].map(
                  (x) => (
                    <TabsTrigger
                      key={x}
                      value={x}
                      className="rounded-none border-b-2 border-transparent px-2 pb-4 text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                    >
                      {x === "All" ? "All transactions" : x}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
              <div className="ml-auto pb-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Download statement
                </Button>
              </div>
            </div>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="pl-6">Transaction ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-slate-500"
                  >
                    <Receipt className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    No payment history found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/60">
                    <TableCell className="pl-6 font-mono text-xs text-slate-500">
                      {(p.id || "").substring(0, 16)}...
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {p.description || "Visa Application Fee"}
                    </TableCell>
                    <TableCell
                      className={`font-semibold ${p.status === "REFUNDED" ? "text-emerald-600" : "text-slate-900"}`}
                    >
                      {p.status === "REFUNDED" ? "+" : "-"}
                      {formatCurrency(p.amountTotal, p.currency)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {p.provider || "WALLET"}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="pr-6 text-xs text-slate-500">
                      {dayjs(p.createdAt).format("MMM D, YYYY · h:mm A")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-auto border-t border-slate-100 p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">10</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Card>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card className="border-slate-200/80">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Spending overview
                </h3>
                <Select defaultValue="year">
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">This year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Total spent
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(totalPaid)}
              </p>

              <ChartContainer
                config={spendChartConfig}
                className="mt-6 h-32 w-full aspect-auto"
              >
                <AreaChart
                  data={SPARK_DATA}
                  margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="spendGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-amount)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-amount)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <ChartTooltip
                    cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => [`$${value}`, "Spend"]}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    strokeWidth={2}
                    fill="url(#spendGradient)"
                  />
                </AreaChart>
              </ChartContainer>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <div className="h-3 w-3 rounded-full bg-blue-600" />{" "}
                    Applications
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />{" "}
                    Wallet Balance
                  </span>
                  <span className="font-medium text-slate-900">{balance}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />{" "}
                    Refunds
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(totalRefunded)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-slate-900">
                Quick actions
              </h3>
              <div className="-mx-2 space-y-1">
                {[
                  { label: "Make a payment", icon: CreditCard },
                  { label: "Add funds to wallet", icon: Wallet },
                  { label: "Download statement", icon: Download },
                  { label: "View refunds", icon: RotateCcw },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="group flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
                  >
                    <span className="flex items-center gap-2.5 font-medium">
                      <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                      {label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card className="overflow-hidden border-blue-100 bg-blue-50/50">
        <CardContent className="flex items-center gap-5 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-blue-900">
              Secure payments
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-blue-800/70">
              Your payments are protected with bank-level security and AES-256
              encryption. VisaFlow does not store your credit card information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
