"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  Globe,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { ApplicationSummary } from "@visaflow/shared-types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type StatusConfig = { label: string; variant: string };

const defaultStatusConfig: StatusConfig = {
  label: "Draft",
  variant: "muted",
};

const statusConfig: Record<string, StatusConfig> = {
  DRAFT: defaultStatusConfig,
  SUBMITTED: { label: "Submitted", variant: "info" },
  UNDER_REVIEW: { label: "Under Review", variant: "warning" },
  MISSING_DOCUMENTS: { label: "Docs Needed", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  COMPLETED: { label: "Completed", variant: "success" },
};

interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  approvedToday: number;
  rejectedTotal: number;
  totalUsers: number;
  revenueThisMonth: number;
}

export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalApplications: 0,
    pendingReview: 0,
    approvedToday: 0,
    rejectedTotal: 0,
    totalUsers: 0,
    revenueThisMonth: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get("/applications?limit=10&sort=createdAt:desc"),
      api.get("/admin/analytics"),
    ])
      .then(([appRes, analyticsRes]) => {
        const apps: ApplicationSummary[] = getResponseItems<ApplicationSummary>(
          appRes.data.data,
        );
        const analytics = analyticsRes.data.data;
        setApplications(apps);
        setStats({
          totalApplications:
            analytics.overview?.totalApplications ??
            appRes.data.data?.total ??
            apps.length,
          pendingReview: analytics.pendingReview ?? 0,
          approvedToday: analytics.approvedApplications ?? 0,
          rejectedTotal: analytics.rejectedApplications ?? 0,
          totalUsers: analytics.overview?.totalUsers ?? 0,
          revenueThisMonth:
            analytics.revenueThisMonth ?? analytics.overview?.totalRevenue ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      color: "text-brand",
      bg: "bg-brand-soft",
      change: `${stats.totalUsers} users`,
    },
    {
      label: "Pending Review",
      value: stats.pendingReview,
      icon: Clock,
      color: "text-warning-foreground",
      bg: "bg-warning/10",
      change: "Needs action",
    },
    {
      label: "Approved",
      value: stats.approvedToday,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
      change: "All time",
    },
    {
      label: "Rejected",
      value: stats.rejectedTotal,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      change: `$${(stats.revenueThisMonth / 100).toLocaleString()} revenue`,
    },
  ];

  const actionRequired = applications.filter((a) =>
    ["SUBMITTED", "UNDER_REVIEW", "MISSING_DOCUMENTS"].includes(a.status),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of all applications and system activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </p>
                  <div
                    className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                  >
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {card.value}
                </p>
                <p className="text-xs mt-1 font-medium text-muted-foreground">
                  {card.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Applications</CardTitle>
                <Link
                  href="/admin/applications"
                  className="text-sm text-brand hover:text-brand font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/70" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground/70">
                  <Globe className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => {
                    const cfg = statusConfig[app.status] ?? defaultStatusConfig;
                    return (
                      <Link key={app.id} href={`/admin/applications/${app.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sand/45 transition-colors cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                            {app.destinationCountry.flagEmoji ?? "🌍"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {app.applicantFirstName} {app.applicantLastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {app.destinationCountry.name} ·{" "}
                              {app.referenceNumber}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={cfg.variant as never}
                              className="text-xs"
                            >
                              {cfg.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground/70">
                              {dayjs(app.createdAt).fromNow()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          {/* Action required */}
          <Card className={actionRequired.length > 0 ? "border-coral/30" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {actionRequired.length > 0 && (
                  <AlertCircle className="w-4 h-4 text-coral" />
                )}
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {actionRequired.length === 0 ? (
                <div className="flex items-center gap-2 text-success py-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">All caught up!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {actionRequired.slice(0, 4).map((app) => (
                    <Link key={app.id} href={`/admin/applications/${app.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-coral/15 transition-colors cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-coral/20 flex items-center justify-center text-sm shrink-0">
                          {app.destinationCountry.flagEmoji}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {app.referenceNumber}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.status.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {actionRequired.length > 4 && (
                    <p className="text-xs text-muted-foreground/70 text-center">
                      +{actionRequired.length - 4} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                {
                  href: "/admin/applications",
                  label: "Review Applications",
                  icon: FileText,
                  color: "blue",
                },
                {
                  href: "/admin/users",
                  label: "Manage Users",
                  icon: Users,
                  color: "green",
                },
                {
                  href: "/admin/countries",
                  label: "Manage Countries",
                  icon: Globe,
                  color: "purple",
                },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-${item.color}-50 transition-colors cursor-pointer`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl bg-${item.color}-100 flex items-center justify-center`}
                    >
                      <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/70 ml-auto" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
