"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  Clock,
  FileText,
  Globe,
  Loader2,
  TrendingUp,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { ApplicationSummary } from "@visaflow/shared-types";

type Analytics = {
  overview?: {
    totalApplications: number;
    totalRevenue: number;
    activeApplications: number;
    approvalRate: number;
    totalUsers: number;
  };
  pendingReview?: number;
  approvedApplications?: number;
  rejectedApplications?: number;
  openTickets?: number;
  revenueThisMonth?: number;
  applicationsByStatus?: Record<string, number>;
};

function formatMoney(cents = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function AdminAnalyticsPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/applications?limit=200"),
      api.get("/admin/analytics"),
    ])
      .then(([apps, stats]) => {
        setApplications(getResponseItems<ApplicationSummary>(apps.data.data));
        setAnalytics(stats.data.data ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = analytics.overview?.totalApplications ?? applications.length;
  const approved =
    analytics.approvedApplications ??
    applications.filter((a) => ["APPROVED", "COMPLETED"].includes(a.status))
      .length;
  const pending =
    analytics.pendingReview ??
    applications.filter((a) =>
      ["SUBMITTED", "UNDER_REVIEW", "MISSING_DOCUMENTS"].includes(a.status),
    ).length;
  const approvalRate =
    analytics.overview?.approvalRate ??
    (total ? Math.round((approved / total) * 100) : 0);

  const statusCounts = analytics.applicationsByStatus;
  const getStatusCount = (status: string) =>
    statusCounts?.[status] ??
    applications.filter((a) => a.status === status).length;
  const statusBreakdown = [
    { label: "Draft", value: getStatusCount("DRAFT"), color: "bg-gray-300" },
    {
      label: "Submitted",
      value: getStatusCount("SUBMITTED"),
      color: "bg-coral",
    },
    {
      label: "Under Review",
      value: getStatusCount("UNDER_REVIEW"),
      color: "bg-warning",
    },
    {
      label: "Missing Docs",
      value: getStatusCount("MISSING_DOCUMENTS"),
      color: "bg-orange-400",
    },
    {
      label: "Approved",
      value: getStatusCount("APPROVED") + getStatusCount("COMPLETED"),
      color: "bg-green-500",
    },
    {
      label: "Rejected",
      value: getStatusCount("REJECTED"),
      color: "bg-red-500",
    },
  ].filter((item) => item.value > 0);

  const countryMap = new Map<
    string,
    { name: string; flag: string; count: number; approved: number }
  >();
  applications.forEach((app) => {
    const key = app.destinationCountry.name;
    const current = countryMap.get(key) ?? {
      name: key,
      flag: app.destinationCountry.flagEmoji ?? "🌍",
      count: 0,
      approved: 0,
    };
    current.count += 1;
    if (["APPROVED", "COMPLETED"].includes(app.status)) current.approved += 1;
    countryMap.set(key, current);
  });
  const topCountries = [...countryMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxCountryCount = topCountries[0]?.count ?? 1;

  const tierBreakdown = ["STANDARD", "EXPEDITED", "RUSH"].map((tier) => ({
    label: tier[0] + tier.slice(1).toLowerCase(),
    value: applications.filter((a) => a.processingTier === tier).length,
  }));

  const summaryCards = [
    {
      label: "Applications",
      value: total,
      icon: FileText,
      detail: `${pending} pending review`,
    },
    {
      label: "Approval rate",
      value: `${approvalRate}%`,
      icon: TrendingUp,
      detail: `${approved} approved or completed`,
    },
    {
      label: "Users",
      value: analytics.overview?.totalUsers ?? 0,
      icon: Users,
      detail: "Active applicant accounts",
    },
    {
      label: "Revenue",
      value: formatMoney(
        analytics.revenueThisMonth ?? analytics.overview?.totalRevenue ?? 0,
      ),
      icon: WalletCards,
      detail: "Completed this month",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Accurate application, revenue, support, and destination metrics from
          admin APIs.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft">
                    <card.icon className="h-4 w-4 text-brand" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {card.detail}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.length ? (
              statusBreakdown.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-muted-foreground">
                    {item.label}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: total ? `${(item.value / total) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold">
                    {item.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No status data yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4" /> Processing Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {tierBreakdown.map((tier) => (
                <div
                  key={tier.label}
                  className="rounded-xl bg-brand-soft p-4 text-center text-brand"
                >
                  <p className="text-2xl font-bold">{tier.value}</p>
                  <p className="mt-1 text-xs font-medium">{tier.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
              <Clock className="mr-2 inline h-4 w-4" /> Open support tickets:{" "}
              <span className="font-semibold text-foreground">
                {analytics.openTickets ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> Top Destinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCountries.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {topCountries.map((country, i) => (
                <div key={country.name} className="flex items-center gap-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between">
                      <span className="truncate text-sm font-medium">
                        {country.name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {country.count} apps
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-coral"
                        style={{
                          width: `${(country.count / maxCountryCount) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {country.count
                        ? Math.round((country.approved / country.count) * 100)
                        : 0}
                      % approval rate
                    </p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <XCircle className="mx-auto mb-2 h-8 w-8 opacity-40" /> No
              destination data yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
