"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Download,
  AlertCircle,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { ApplicationEntity } from "@visaflow/shared-types";
import dayjs from "dayjs";

type StatusConfig = {
  label: string;
  variant: string;
  icon: React.ElementType;
  description: string;
};
type DocStatusConfig = { label: string; color: string };

const defaultStatusConfig: StatusConfig = {
  label: "Draft",
  variant: "muted",
  icon: FileText,
  description: "Your application is being filled out.",
};

const defaultDocStatusConfig: DocStatusConfig = {
  label: "Pending",
  color: "text-muted-foreground",
};

const statusConfig: Record<string, StatusConfig> = {
  DRAFT: defaultStatusConfig,
  SUBMITTED: {
    label: "Submitted",
    variant: "info",
    icon: Clock,
    description: "Your application has been submitted for review.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    variant: "warning",
    icon: Clock,
    description: "Our team is reviewing your application.",
  },
  MISSING_DOCUMENTS: {
    label: "Action Required",
    variant: "warning",
    icon: AlertCircle,
    description: "Additional documents are required to continue.",
  },
  APPROVED: {
    label: "Approved",
    variant: "success",
    icon: CheckCircle2,
    description: "Your visa application has been approved!",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
    description: "Unfortunately your application was rejected.",
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
    icon: CheckCircle2,
    description: "Your visa has been issued and is ready.",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "secondary",
    icon: XCircle,
    description: "This application has been cancelled.",
  },
};

const docStatusConfig: Record<string, DocStatusConfig> = {
  PENDING: defaultDocStatusConfig,
  UPLOADING: { label: "Uploading", color: "text-coral" },
  PROCESSING: { label: "Processing", color: "text-warning-foreground" },
  VERIFIED: { label: "Verified", color: "text-success" },
  REJECTED: { label: "Rejected", color: "text-destructive" },
  EXPIRED: { label: "Expired", color: "text-coral" },
};

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationEntity | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/applications/${id}`)
      .then(({ data }) => {
        setApplication(data.data);
      })
      .catch(() => router.push("/dashboard/applications"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!application) return null;

  const cfg = statusConfig[application.status] ?? defaultStatusConfig;
  const StatusIcon = cfg.icon;
  const totalPaid = application.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amountTotal, 0);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-soft flex items-center justify-center text-3xl">
                {application.destinationCountry.flagEmoji ?? "🌍"}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-foreground">
                    {application.visaType.name}
                  </h1>
                  <Badge variant={cfg.variant as never} className="gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {application.destinationCountry.name} · Ref:{" "}
                  <span className="font-mono font-medium text-foreground/80">
                    {application.referenceNumber}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {cfg.description}
                </p>
              </div>
              <div className="flex gap-2">
                {application.status === "DRAFT" && totalPaid === 0 && (
                  <Link
                    href={`/dashboard/payments/${id}?tier=${application.processingTier}`}
                  >
                    <Button variant="brand" size="sm">
                      Pay Now
                    </Button>
                  </Link>
                )}
                {application.status === "DRAFT" && (
                  <Link href={`/dashboard/applications/new?continue=${id}`}>
                    <Button variant="outline" size="sm">
                      Continue
                    </Button>
                  </Link>
                )}
                {application.status === "MISSING_DOCUMENTS" && (
                  <Button variant="brand" size="sm" className="gap-1">
                    <Upload className="w-4 h-4" />
                    Upload Docs
                  </Button>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Application Progress</span>
                <span className="font-semibold text-foreground/80">
                  {application.completionPercentage}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${application.completionPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-brand to-coral rounded-full"
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
                  {
                    label: "Full Name",
                    value: `${application.applicantFirstName} ${application.applicantLastName}`,
                  },
                  { label: "Email", value: application.applicantEmail },
                  { label: "Phone", value: application.applicantPhone ?? "—" },
                  {
                    label: "Date of Birth",
                    value: application.applicantDob
                      ? dayjs(application.applicantDob).format("DD MMM YYYY")
                      : "—",
                  },
                  {
                    label: "Passport No.",
                    value: application.applicantPassportNo ?? "—",
                  },
                  {
                    label: "Passport Expiry",
                    value: application.applicantPassportExpiry
                      ? dayjs(application.applicantPassportExpiry).format(
                          "DD MMM YYYY",
                        )
                      : "—",
                  },
                  {
                    label: "Travel From",
                    value: application.travelDateFrom
                      ? dayjs(application.travelDateFrom).format("DD MMM YYYY")
                      : "—",
                  },
                  {
                    label: "Travel To",
                    value: application.travelDateTo
                      ? dayjs(application.travelDateTo).format("DD MMM YYYY")
                      : "—",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {item.value}
                    </p>
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
                {application.documents.map((doc) => {
                  const ds =
                    docStatusConfig[doc.status] ?? defaultDocStatusConfig;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-sand/45 rounded-xl"
                    >
                      <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center border border-border">
                        <FileText className="w-4 h-4 text-muted-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doc.originalFileName}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {doc.documentType.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${ds.color}`}>
                        {ds.label}
                      </span>
                      {doc.cdnUrl && (
                        <a href={doc.cdnUrl} target="_blank" rel="noreferrer">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                          >
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
            <Card className="border-destructive/30 bg-destructive/10">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive text-sm mb-1">
                      Application Rejected
                    </p>
                    <p className="text-sm text-destructive">
                      {application.rejectionReason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing docs note */}
          {application.missingDocumentsNote && (
            <Card className="border-coral/30 bg-coral/15">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-warning-foreground text-sm mb-1">
                      Action Required
                    </p>
                    <p className="text-sm text-coral">
                      {application.missingDocumentsNote}
                    </p>
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
                { label: "Processing", value: application.processingTier },
                { label: "Entry Type", value: application.visaType.entryType },
                {
                  label: "Stay Duration",
                  value: application.visaType.stayDuration
                    ? `${application.visaType.stayDuration} days`
                    : "—",
                },
                {
                  label: "Submitted",
                  value: application.submittedAt
                    ? dayjs(application.submittedAt).format("DD MMM YYYY")
                    : "—",
                },
                {
                  label: "Created",
                  value: dayjs(application.createdAt).format("DD MMM YYYY"),
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
              {totalPaid > 0 && (
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-bold text-foreground">
                    ${(totalPaid / 100).toFixed(2)}
                  </span>
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
                        <div className="w-2 h-2 rounded-full bg-coral mt-1.5" />
                        {i < application.statusHistory.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-medium text-foreground">
                          {entry.toStatus.replace(/_/g, " ")}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {entry.note}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {dayjs(entry.createdAt).format("DD MMM YYYY HH:mm")}
                        </p>
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
