'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Globe, ArrowRight, Loader2,
  FileText, CheckCircle2, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { ApplicationSummary, ApplicationStatus } from '@visaflow/shared-types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
];

type StatusConfig = {
  label: string;
  icon: React.ElementType;
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'info' | 'muted' | 'outline';
};

const defaultStatusConfig: StatusConfig = {
  label: 'Draft',
  icon: FileText,
  variant: 'muted',
};

const statusConfig: Record<string, StatusConfig> = {
  DRAFT:             defaultStatusConfig,
  SUBMITTED:         { label: 'Submitted',       icon: Clock,        variant: 'info'        },
  UNDER_REVIEW:      { label: 'Under Review',    icon: Clock,        variant: 'warning'     },
  MISSING_DOCUMENTS: { label: 'Docs Needed',     icon: AlertCircle,  variant: 'warning'     },
  APPROVED:          { label: 'Approved',        icon: CheckCircle2, variant: 'success'     },
  REJECTED:          { label: 'Rejected',        icon: XCircle,      variant: 'destructive' },
  COMPLETED:         { label: 'Completed',       icon: CheckCircle2, variant: 'success'     },
  CANCELLED:         { label: 'Cancelled',       icon: XCircle,      variant: 'secondary'   },
};

const tierConfig: Record<string, string> = {
  STANDARD: 'Standard',
  EXPEDITED: 'Expedited',
  RUSH: 'Rush',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.get('/applications?limit=50').then(({ data }) => {
      setApplications(getResponseItems<ApplicationSummary>(data.data));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter(app => {
    const matchesSearch =
      app.destinationCountry.name.toLowerCase().includes(search.toLowerCase()) ||
      app.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.visaType.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 mt-1">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/applications/new">
          <Button variant="brand" className="gap-2">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by country, reference..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search || statusFilter !== 'ALL' ? 'No applications found' : 'No applications yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {search || statusFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Create your first visa application to get started.'}
          </p>
          {(!search && statusFilter === 'ALL') && (
            <Link href="/dashboard/applications/new">
              <Button variant="brand">Start Application</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((app, i) => {
            const cfg = statusConfig[app.status] ?? defaultStatusConfig;
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={`/dashboard/applications/${app.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                          {app.destinationCountry.flagEmoji ?? '🌍'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">{app.visaType.name}</h3>
                              <p className="text-gray-500 text-xs mt-0.5">
                                {app.destinationCountry.name} · Ref: {app.referenceNumber}
                              </p>
                            </div>
                            <Badge variant={cfg.variant as never} className="flex-shrink-0 gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mt-3">
                            {/* Progress bar */}
                            <div className="flex-1 max-w-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Completion</span>
                                <span className="text-xs font-medium text-gray-700">{app.completionPercentage}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: `${app.completionPercentage}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                              <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium">
                                {tierConfig[app.processingTier] ?? app.processingTier}
                              </span>
                              <span>{dayjs(app.createdAt).fromNow()}</span>
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
