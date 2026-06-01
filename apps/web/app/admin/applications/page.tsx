'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Loader2, Globe, ArrowRight, Filter, CheckCircle, XCircle,
  Clock, ChevronDown, Eye, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { ApplicationSummary } from '@visaflow/shared-types';
import dayjs from 'dayjs';
import { toast } from 'sonner';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'MISSING_DOCUMENTS', label: 'Missing Docs' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
];

type StatusConfig = { label: string; variant: string };

const defaultStatusConfig: StatusConfig = {
  label: 'Draft',
  variant: 'muted',
};

const statusConfig: Record<string, StatusConfig> = {
  DRAFT:             defaultStatusConfig,
  SUBMITTED:         { label: 'Submitted',       variant: 'info'        },
  UNDER_REVIEW:      { label: 'Under Review',    variant: 'warning'     },
  MISSING_DOCUMENTS: { label: 'Docs Needed',     variant: 'warning'     },
  APPROVED:          { label: 'Approved',        variant: 'success'     },
  REJECTED:          { label: 'Rejected',        variant: 'destructive' },
  COMPLETED:         { label: 'Completed',       variant: 'success'     },
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchApps = () => {
    setLoading(true);
    api.get('/applications?limit=50').then(({ data }) => {
      setApplications(getResponseItems<ApplicationSummary>(data.data));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'review') => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/applications/${id}/status`, {
        status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'UNDER_REVIEW',
      });
      toast.success(`Application ${action}d`);
      fetchApps();
    } catch {
      toast.error('Action failed.');
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const filtered = applications.filter(app => {
    const matchesSearch =
      `${app.applicantFirstName} ${app.applicantLastName}`.toLowerCase().includes(search.toLowerCase()) ||
      app.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.destinationCountry.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">{applications.length} total · {filtered.length} shown</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reference, country..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === f.value ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Applicant', 'Destination', 'Reference', 'Status', 'Processing', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No applications found
                    </td>
                  </tr>
                ) : filtered.map((app, i) => {
                  const cfg = statusConfig[app.status] ?? defaultStatusConfig;
                  const isLoading = actionLoading[app.id];
                  return (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{app.applicantFirstName} {app.applicantLastName}</p>
                        <p className="text-xs text-gray-400">{app.visaType.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{app.destinationCountry.flagEmoji}</span>
                          <span className="text-gray-700">{app.destinationCountry.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{app.referenceNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant as never} className="text-xs">{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                        {app.processingTier.toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {dayjs(app.createdAt).format('DD MMM YY')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/applications/${app.id}`}>
                            <Button variant="ghost" size="icon" className="w-7 h-7">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {['SUBMITTED', 'UNDER_REVIEW'].includes(app.status) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-green-600 hover:bg-green-50"
                                onClick={() => handleAction(app.id, 'approve')}
                                disabled={isLoading}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-red-500 hover:bg-red-50"
                                onClick={() => handleAction(app.id, 'reject')}
                                disabled={isLoading}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
