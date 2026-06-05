'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle2, Clock, XCircle, TrendingUp,
  Globe, ArrowRight, Plus, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { ApplicationSummary } from '@visaflow/shared-types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type StatusConfig = { label: string; color: string; bg: string };

const defaultStatusConfig: StatusConfig = {
  label: 'Draft',
  color: 'text-muted-foreground',
  bg: 'bg-muted',
};

const statusConfig: Record<string, StatusConfig> = {
  DRAFT:            defaultStatusConfig,
  SUBMITTED:        { label: 'Submitted',       color: 'text-brand',  bg: 'bg-brand-soft'   },
  UNDER_REVIEW:     { label: 'Under Review',    color: 'text-warning-foreground',bg: 'bg-warning/20' },
  MISSING_DOCUMENTS:{ label: 'Docs Needed',     color: 'text-warning-foreground',bg: 'bg-coral/20' },
  APPROVED:         { label: 'Approved',        color: 'text-success-foreground', bg: 'bg-success/15'  },
  REJECTED:         { label: 'Rejected',        color: 'text-destructive',   bg: 'bg-destructive/15'    },
  COMPLETED:        { label: 'Completed',       color: 'text-success-foreground', bg: 'bg-success/15'  },
  CANCELLED:        { label: 'Cancelled',       color: 'text-muted-foreground',  bg: 'bg-muted'   },
};

const statCards = (stats: { total: number; approved: number; inProgress: number; rejected: number }) => [
  { label: 'Total Applications', value: stats.total,      icon: FileText,      color: 'text-brand',   bg: 'bg-brand-soft'   },
  { label: 'Approved',           value: stats.approved,   icon: CheckCircle2,  color: 'text-success',  bg: 'bg-success/10'  },
  { label: 'In Progress',        value: stats.inProgress, icon: Clock,         color: 'text-warning-foreground', bg: 'bg-warning/10' },
  { label: 'Rejected',           value: stats.rejected,   icon: XCircle,       color: 'text-destructive',    bg: 'bg-destructive/10'    },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications?limit=5').then(({ data }) => {
      setApplications(getResponseItems<ApplicationSummary>(data.data));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = {
    total:      applications.length,
    approved:   applications.filter(a => ['APPROVED','COMPLETED'].includes(a.status)).length,
    inProgress: applications.filter(a => ['SUBMITTED','UNDER_REVIEW','MISSING_DOCUMENTS'].includes(a.status)).length,
    rejected:   applications.filter(a => a.status === 'REJECTED').length,
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {user?.firstName ?? 'there'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here&apos;s an overview of your visa applications.</p>
        </div>
        <Link href="/dashboard/applications/new">
          <Button variant="brand" className="gap-2">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards(stats).map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Applications + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Applications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Applications</CardTitle>
                <Link href="/dashboard/applications" className="text-sm text-brand hover:text-brand font-medium flex items-center gap-1">
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
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No applications yet</p>
                  <p className="text-muted-foreground/70 text-sm mb-4">Start your first visa application today.</p>
                  <Link href="/dashboard/applications/new">
                    <Button variant="brand" size="sm">Apply Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const cfg = statusConfig[app.status] ?? defaultStatusConfig;
                    return (
                      <Link key={app.id} href={`/dashboard/applications/${app.id}`}>
                        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-sand/45 transition-colors group cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center text-lg shrink-0">
                            {app.destinationCountry.flagEmoji ?? '🌍'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{app.visaType.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {app.destinationCountry.name} · {app.referenceNumber}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground/70">{dayjs(app.createdAt).fromNow()}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Link href="/dashboard/applications/new">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-soft transition-colors text-left group">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center">
                    <Plus className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">New Application</p>
                    <p className="text-xs text-muted-foreground">Start a visa application</p>
                  </div>
                </button>
              </Link>
              <Link href="/dashboard/explore">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-success/10 transition-colors text-left group">
                  <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Explore Countries</p>
                    <p className="text-xs text-muted-foreground">Check visa requirements</p>
                  </div>
                </button>
              </Link>
              <Link href="/dashboard/profile">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-soft transition-colors text-left group">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center">
                    <FileText className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Complete Profile</p>
                    <p className="text-xs text-muted-foreground">Speed up future applications</p>
                  </div>
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Progress tip */}
          <Card className="bg-linear-to-br bg-hero border-0 text-white">
            <CardContent className="p-5">
              <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-semibold mb-1">Complete Your Profile</h3>
              <p className="text-sm text-brand-foreground/80 mb-4">Fill in your passport details to pre-fill applications faster.</p>
              <Link href="/dashboard/profile">
                <Button variant="secondary" size="sm" className="w-full bg-card/20 hover:bg-card/30 border-0 text-white">
                  Go to Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
