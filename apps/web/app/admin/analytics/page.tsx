'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, FileText, Users, CheckCircle2,
  XCircle, Clock, Globe, BarChart2, Activity, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { ApplicationSummary } from '@visaflow/shared-types';

interface CountryStat {
  name: string;
  flag: string;
  count: number;
  approved: number;
}

interface MonthStat {
  month: string;
  total: number;
  approved: number;
  rejected: number;
}

export default function AdminAnalyticsPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications?limit=200').then(({ data }) => {
      setApplications(getResponseItems<ApplicationSummary>(data.data));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Derived stats
  const total = applications.length;
  const approved = applications.filter(a => ['APPROVED', 'COMPLETED'].includes(a.status)).length;
  const rejected = applications.filter(a => a.status === 'REJECTED').length;
  const pending = applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length;
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;

  // By country
  const countryMap: Record<string, CountryStat> = {};
  for (const app of applications) {
    const key = app.destinationCountry.name;
    if (!countryMap[key]) {
      countryMap[key] = { name: key, flag: app.destinationCountry.flagEmoji ?? '🌍', count: 0, approved: 0 };
    }
    countryMap[key].count++;
    if (['APPROVED', 'COMPLETED'].includes(app.status)) countryMap[key].approved++;
  }
  const topCountries = Object.values(countryMap).sort((a, b) => b.count - a.count).slice(0, 6);
  const maxCountryCount = topCountries[0]?.count ?? 1;

  // By status breakdown
  const statusBreakdown = [
    { label: 'Draft',          value: applications.filter(a => a.status === 'DRAFT').length,             color: 'bg-gray-200', text: 'text-muted-foreground' },
    { label: 'Submitted',      value: applications.filter(a => a.status === 'SUBMITTED').length,          color: 'bg-coral/80', text: 'text-brand' },
    { label: 'Under Review',   value: applications.filter(a => a.status === 'UNDER_REVIEW').length,       color: 'bg-warning', text: 'text-warning-foreground' },
    { label: 'Missing Docs',   value: applications.filter(a => a.status === 'MISSING_DOCUMENTS').length,  color: 'bg-orange-400', text: 'text-warning-foreground' },
    { label: 'Approved',       value: approved,                                                            color: 'bg-green-400', text: 'text-success-foreground' },
    { label: 'Rejected',       value: rejected,                                                            color: 'bg-red-400', text: 'text-destructive' },
  ].filter(s => s.value > 0);

  // By processing tier
  const tierBreakdown = [
    { label: 'Standard',  value: applications.filter(a => a.processingTier === 'STANDARD').length,  color: 'bg-brand-soft text-brand' },
    { label: 'Expedited', value: applications.filter(a => a.processingTier === 'EXPEDITED').length, color: 'bg-brand-soft text-brand' },
    { label: 'Rush',      value: applications.filter(a => a.processingTier === 'RUSH').length,      color: 'bg-coral/20 text-warning-foreground' },
  ];

  const summaryCards = [
    { label: 'Total Applications', value: total,        icon: FileText,     color: 'text-brand',   bg: 'bg-brand-soft',   change: '+12%', up: true },
    { label: 'Approval Rate',      value: `${approvalRate}%`, icon: TrendingUp,  color: 'text-success',  bg: 'bg-success/10',  change: '+5%',  up: true },
    { label: 'Pending Review',     value: pending,      icon: Clock,        color: 'text-warning-foreground', bg: 'bg-warning/10', change: '-3%',  up: false },
    { label: 'Rejected',           value: rejected,     icon: XCircle,      color: 'text-destructive',    bg: 'bg-destructive/10',    change: '-2%',  up: false },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-coral mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Application metrics and performance overview.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
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
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${card.up ? 'text-success' : 'text-destructive'}`}>
                  {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.change} vs last month
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground/70" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {statusBreakdown.length === 0 ? (
                <p className="text-muted-foreground/70 text-sm text-center py-6">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {statusBreakdown.map(s => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{s.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.color} transition-all duration-500`}
                          style={{ width: total ? `${(s.value / total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className={`text-xs font-semibold w-6 text-right ${s.text}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Processing Tier Breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground/70" />
                Processing Tier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-4 mb-6">
                {tierBreakdown.map(t => (
                  <div key={t.label} className={`flex-1 rounded-xl p-4 text-center ${t.color}`}>
                    <p className="text-2xl font-bold">{t.value}</p>
                    <p className="text-xs font-medium mt-1">{t.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {tierBreakdown.map(t => (
                  <div key={t.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{t.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full"
                        style={{ width: total ? `${(t.value / total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {total ? Math.round((t.value / total) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Destinations */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground/70" />
              Top Destinations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topCountries.length === 0 ? (
              <p className="text-muted-foreground/70 text-sm text-center py-6">No destination data yet</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {topCountries.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{c.count} apps</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coral rounded-full"
                          style={{ width: `${(c.count / maxCountryCount) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {c.count ? Math.round((c.approved / c.count) * 100) : 0}% approval rate
                      </p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground/70 w-5 text-right flex-shrink-0">#{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
