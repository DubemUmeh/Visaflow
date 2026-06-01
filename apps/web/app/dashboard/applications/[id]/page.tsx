'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, Globe, Clock, CheckCircle2, XCircle,
  FileText, CreditCard, Download, AlertCircle, Upload, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import type { ApplicationEntity } from '@visaflow/shared-types';
import dayjs from 'dayjs';

type StatusConfig = { label: string; variant: string; icon: React.ElementType; description: string };
type DocStatusConfig = { label: string; color: string };

const defaultStatusConfig: StatusConfig = {
  label: 'Draft',
  variant: 'muted',
  icon: FileText,
  description: 'Your application is being filled out.',
};

const defaultDocStatusConfig: DocStatusConfig = {
  label: 'Pending',
  color: 'text-gray-500',
};

const statusConfig: Record<string, StatusConfig> = {
  DRAFT:             defaultStatusConfig,
  SUBMITTED:         { label: 'Submitted',       variant: 'info',        icon: Clock,        description: 'Your application has been submitted for review.' },
  UNDER_REVIEW:      { label: 'Under Review',    variant: 'warning',     icon: Clock,        description: 'Our team is reviewing your application.' },
  MISSING_DOCUMENTS: { label: 'Action Required', variant: 'warning',     icon: AlertCircle,  description: 'Additional documents are required to continue.' },
  APPROVED:          { label: 'Approved',        variant: 'success',     icon: CheckCircle2, description: 'Your visa application has been approved!' },
  REJECTED:          { label: 'Rejected',        variant: 'destructive', icon: XCircle,      description: 'Unfortunately your application was rejected.' },
  COMPLETED:         { label: 'Completed',       variant: 'success',     icon: CheckCircle2, description: 'Your visa has been issued and is ready.' },
  CANCELLED:         { label: 'Cancelled',       variant: 'secondary',   icon: XCircle,      description: 'This application has been cancelled.' },
};

const docStatusConfig: Record<string, DocStatusConfig> = {
  PENDING:    defaultDocStatusConfig,
  UPLOADING:  { label: 'Uploading',  color: 'text-blue-500'  },
  PROCESSING: { label: 'Processing', color: 'text-yellow-600'},
  VERIFIED:   { label: 'Verified',   color: 'text-green-600' },
  REJECTED:   { label: 'Rejected',   color: 'text-red-600'   },
  EXPIRED:    { label: 'Expired',    color: 'text-orange-500'},
};

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/applications/${id}`).then(({ data }) => {
      setApplication(data.data);
    }).catch(() => router.push('/dashboard/applications')).finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!application) return null;

  const cfg = statusConfig[application.status] ?? defaultStatusConfig;
  const StatusIcon = cfg.icon;
  const totalPaid = application.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amountTotal, 0);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link href="/dashboard/applications" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-3xl">
                {application.destinationCountry.flagEmoji ?? '🌍'}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{application.visaType.name}</h1>
                  <Badge variant={cfg.variant as never} className="gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </Badge>
                </div>
                <p className="text-gray-500 text-sm">
                  {application.destinationCountry.name} · Ref: <span className="font-mono font-medium text-gray-700">{application.referenceNumber}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{cfg.description}</p>
              </div>
              <div className="flex gap-2">
                {application.status === 'DRAFT' && (
                  <Link href={`/dashboard/applications/new?continue=${id}`}>
                    <Button variant="brand" size="sm">Continue</Button>
                  </Link>
                )}
                {application.status === 'MISSING_DOCUMENTS' && (
                  <Button variant="brand" size="sm" className="gap-1">
                    <Upload className="w-4 h-4" />
                    Upload Docs
                  </Button>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Application Progress</span>
                <span className="font-semibold text-gray-700">{application.completionPercentage}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${application.completionPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicant Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: `${application.applicantFirstName} ${application.applicantLastName}` },
                  { label: 'Email', value: application.applicantEmail },
                  { label: 'Phone', value: application.applicantPhone ?? '—' },
                  { label: 'Date of Birth', value: application.applicantDob ? dayjs(application.applicantDob).format('DD MMM YYYY') : '—' },
                  { label: 'Passport No.', value: application.applicantPassportNo ?? '—' },
                  { label: 'Passport Expiry', value: application.applicantPassportExpiry ? dayjs(application.applicantPassportExpiry).format('DD MMM YYYY') : '—' },
                  { label: 'Travel From', value: application.travelDateFrom ? dayjs(application.travelDateFrom).format('DD MMM YYYY') : '—' },
                  { label: 'Travel To', value: application.travelDateTo ? dayjs(application.travelDateTo).format('DD MMM YYYY') : '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {application.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {application.documents.map(doc => {
                  const ds = docStatusConfig[doc.status] ?? defaultDocStatusConfig;
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.originalFileName}</p>
                        <p className="text-xs text-gray-400">{doc.documentType.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`text-xs font-medium ${ds.color}`}>{ds.label}</span>
                      {doc.cdnUrl && (
                        <a href={doc.cdnUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <Download className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Rejection reason */}
          {application.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 text-sm mb-1">Application Rejected</p>
                    <p className="text-sm text-red-600">{application.rejectionReason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing docs note */}
          {application.missingDocumentsNote && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-700 text-sm mb-1">Action Required</p>
                    <p className="text-sm text-orange-600">{application.missingDocumentsNote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              {[
                { label: 'Processing', value: application.processingTier },
                { label: 'Entry Type', value: application.visaType.entryType },
                { label: 'Stay Duration', value: application.visaType.stayDuration ? `${application.visaType.stayDuration} days` : '—' },
                { label: 'Submitted', value: application.submittedAt ? dayjs(application.submittedAt).format('DD MMM YYYY') : '—' },
                { label: 'Created', value: dayjs(application.createdAt).format('DD MMM YYYY') },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
              {totalPaid > 0 && (
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="text-gray-500">Total Paid</span>
                  <span className="font-bold text-gray-900">${(totalPaid / 100).toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          {application.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">History</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {application.statusHistory.map((entry, i) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        {i < application.statusHistory.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-medium text-gray-900">{entry.toStatus.replace(/_/g, ' ')}</p>
                        {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{dayjs(entry.createdAt).format('DD MMM YYYY HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
