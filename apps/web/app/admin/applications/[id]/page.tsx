"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Globe,
  User,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import dayjs from "dayjs";
import { toast } from "sonner";

interface ApplicationDetail {
  id: string;
  referenceNumber: string;
  status: string;
  processingTier: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantDateOfBirth?: string;
  applicantNationality?: string;
  applicantPassportNumber?: string;
  destinationCountry: { name: string; flagEmoji: string; code: string };
  visaType: { name: string; processingDays?: number; fee?: number };
  travelPurpose?: string;
  intendedEntryDate?: string;
  intendedExitDate?: string;
  notes?: string;
  adminNotes?: string;
  documents?: {
    id: string;
    documentType: string;
    fileName: string;
    originalFileName: string;
    status: string;
  }[];
}

type StatusConfig = { label: string; variant: string; icon: React.ElementType };

const defaultStatusConfig: StatusConfig = {
  label: "Draft",
  variant: "muted",
  icon: FileText,
};

const statusConfig: Record<string, StatusConfig> = {
  DRAFT: defaultStatusConfig,
  SUBMITTED: { label: "Submitted", variant: "info", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", variant: "warning", icon: Clock },
  MISSING_DOCUMENTS: {
    label: "Missing Docs",
    variant: "warning",
    icon: AlertCircle,
  },
  APPROVED: { label: "Approved", variant: "success", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
};

const TRANSITIONS: Record<
  string,
  {
    label: string;
    status: string;
    variant: "brand" | "outline" | "destructive";
  }[]
> = {
  SUBMITTED: [
    { label: "Start Review", status: "UNDER_REVIEW", variant: "brand" },
    { label: "Request Docs", status: "MISSING_DOCUMENTS", variant: "outline" },
    { label: "Reject", status: "REJECTED", variant: "destructive" },
  ],
  UNDER_REVIEW: [
    { label: "Approve", status: "APPROVED", variant: "brand" },
    { label: "Request Docs", status: "MISSING_DOCUMENTS", variant: "outline" },
    { label: "Reject", status: "REJECTED", variant: "destructive" },
  ],
  MISSING_DOCUMENTS: [
    { label: "Resume Review", status: "UNDER_REVIEW", variant: "brand" },
    { label: "Approve", status: "APPROVED", variant: "brand" },
    { label: "Reject", status: "REJECTED", variant: "destructive" },
  ],
  APPROVED: [{ label: "Mark Complete", status: "COMPLETED", variant: "brand" }],
};

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchApp = () => {
    api
      .get(`/applications/${id}`)
      .then(({ data }) => {
        const a = data.data ?? data;
        setApp(a);
        setAdminNote(a.adminNotes ?? "");
      })
      .catch(() => toast.error("Failed to load application"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchApp();
  }, [id]);

  const handleStatusChange = async (status: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/applications/${id}/status`, { status });
      toast.success(
        `Status updated to ${statusConfig[status]?.label ?? status}`,
      );
      fetchApp();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const { data } = await api.get(
        `/documents/applications/${id}/${documentId}/url`,
      );
      const payload = data.data ?? data;
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Failed to create secure document link");
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.patch(`/applications/${id}`, { adminNotes: adminNote });
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-coral" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-20">
        <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">Application not found.</p>
        <Link href="/admin/applications">
          <Button variant="outline" className="mt-4">
            Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  const cfg = statusConfig[app.status] ?? defaultStatusConfig;
  const StatusIcon = cfg.icon;
  const transitions = TRANSITIONS[app.status] ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground/80 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Applications
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center text-2xl">
              {app.destinationCountry.flagEmoji}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {app.visaType.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {app.destinationCountry.name} ·{" "}
                <span className="font-mono">{app.referenceNumber}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={cfg.variant as never} className="gap-1.5">
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Status Actions */}
      {transitions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-brand-soft bg-brand-soft/30">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm font-medium text-foreground/80 flex-1">
                  Update Status:
                </p>
                <div className="flex flex-wrap gap-2">
                  {transitions.map((t) => (
                    <Button
                      key={t.status}
                      variant={t.variant}
                      size="sm"
                      isLoading={actionLoading}
                      onClick={() => handleStatusChange(t.status)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground/70" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 grid sm:grid-cols-2 gap-4">
                <InfoRow
                  label="Full Name"
                  value={`${app.applicantFirstName} ${app.applicantLastName}`}
                />
                <InfoRow label="Email" value={app.applicantEmail ?? "—"} />
                <InfoRow label="Phone" value={app.applicantPhone ?? "—"} />
                <InfoRow
                  label="Date of Birth"
                  value={
                    app.applicantDateOfBirth
                      ? dayjs(app.applicantDateOfBirth).format("DD MMM YYYY")
                      : "—"
                  }
                />
                <InfoRow
                  label="Nationality"
                  value={app.applicantNationality ?? "—"}
                />
                <InfoRow
                  label="Passport No."
                  value={app.applicantPassportNumber ?? "—"}
                  mono
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Travel */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground/70" />
                  Travel Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 grid sm:grid-cols-2 gap-4">
                <InfoRow
                  label="Destination"
                  value={app.destinationCountry.name}
                />
                <InfoRow label="Visa Type" value={app.visaType.name} />
                <InfoRow label="Purpose" value={app.travelPurpose ?? "—"} />
                <InfoRow label="Processing" value={app.processingTier} />
                <InfoRow
                  label="Entry Date"
                  value={
                    app.intendedEntryDate
                      ? dayjs(app.intendedEntryDate).format("DD MMM YYYY")
                      : "—"
                  }
                />
                <InfoRow
                  label="Exit Date"
                  value={
                    app.intendedExitDate
                      ? dayjs(app.intendedExitDate).format("DD MMM YYYY")
                      : "—"
                  }
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Documents */}
          {app.documents && app.documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground/70" />
                    Documents ({app.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {app.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-sand/45"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.originalFileName ?? doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {doc.documentType.replace(/_/g, " ").toLowerCase()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc.id)}
                        >
                          View
                        </Button>
                        <Badge
                          variant={
                            doc.status === "VERIFIED"
                              ? "success"
                              : doc.status === "REJECTED"
                                ? "destructive"
                                : "warning"
                          }
                          className="text-xs"
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Admin Notes */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground/70" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes visible only to admins..."
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    variant="brand"
                    size="sm"
                    isLoading={savingNote}
                    onClick={handleSaveNote}
                    className="gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground/70" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <TimelineRow
                    label="Created"
                    value={dayjs(app.createdAt).format("DD MMM YYYY, HH:mm")}
                  />
                  {app.submittedAt && (
                    <TimelineRow
                      label="Submitted"
                      value={dayjs(app.submittedAt).format(
                        "DD MMM YYYY, HH:mm",
                      )}
                    />
                  )}
                  <TimelineRow
                    label="Updated"
                    value={dayjs(app.updatedAt).format("DD MMM YYYY, HH:mm")}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Completion</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {app.completionPercentage}%
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-coral rounded-full transition-all"
                    style={{ width: `${app.completionPercentage}%` }}
                  />
                </div>
                {app.visaType.fee && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        Application Fee
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        ${app.visaType.fee}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-coral/80 mt-1.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground/70">{label}</p>
        <p className="text-xs font-medium text-foreground/80">{value}</p>
      </div>
    </div>
  );
}
