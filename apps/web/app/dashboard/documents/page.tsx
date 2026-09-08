"use client";
import React, { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Upload,
  Download,
  MoreHorizontal,
  ShieldCheck,
  HardDrive,
  Eye,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { UploadedDocumentEntity } from "@visaflow/shared-types";

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
  tone?: "green" | "orange" | "red";
}) {
  const colorClass =
    tone === "green"
      ? "text-emerald-600 bg-emerald-50"
      : tone === "orange"
        ? "text-orange-600 bg-orange-50"
        : tone === "red"
          ? "text-red-600 bg-red-50"
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
  const map: Record<string, string> = {
    VERIFIED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    PROCESSING: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    UPLOADING: "bg-sky-100 text-sky-700 hover:bg-sky-100",
    PENDING: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    REJECTED: "bg-red-100 text-red-700 hover:bg-red-100",
    EXPIRED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  };
  const labels: Record<string, string> = {
    VERIFIED: "Verified",
    PROCESSING: "Processing",
    UPLOADING: "Uploading",
    PENDING: "Pending review",
    REJECTED: "Rejected",
    EXPIRED: "Expired",
  };
  if (map[status]) {
    return (
      <Badge className={`border-0 ${map[status]}`}>{labels[status]}</Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-slate-200 text-slate-600">
      {status || "Unknown"}
    </Badge>
  );
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const TYPE_FILTERS = ["All Types", "PASSPORT", "FINANCIAL", "TRAVEL", "OTHER"];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UploadedDocumentEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");

  useEffect(() => {
    api
      .get("/documents")
      .then((res) =>
        setDocuments(getResponseItems<UploadedDocumentEntity>(res.data)),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verifiedCount = documents.filter((d) => d.status === "VERIFIED").length;
  const pendingCount = documents.filter((d) =>
    ["PENDING", "PROCESSING", "UPLOADING"].includes(d.status),
  ).length;
  const rejectedCount = documents.filter((d) => d.status === "REJECTED").length;

  const totalSizeBytes = documents.reduce(
    (acc, doc) => acc + (doc.sizeBytes || 0),
    0,
  );
  const storageLimitBytes = 5 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(
    100,
    Math.round((totalSizeBytes / storageLimitBytes) * 100),
  );

  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== "All Types") {
      const docType = (doc.documentType || "").toUpperCase();
      if (!docType.includes(typeFilter.toUpperCase())) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (doc.originalFileName || doc.fileName || "").toLowerCase();
      const type = (doc.documentType || "").toLowerCase();
      return name.includes(q) || type.includes(q);
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Documents
          </h1>
          <p className="mt-1 text-slate-500">
            Manage and upload documents for your visa applications.
          </p>
        </div>
        <Button className="shrink-0 gap-2 bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4" /> Upload document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total documents"
          value={loading ? "—" : documents.length}
          note="Across all applications"
          icon={FileText}
        />
        <StatCard
          label="Verified"
          value={loading ? "—" : verifiedCount}
          note="Documents verified"
          icon={CheckCircle}
          tone="green"
        />
        <StatCard
          label="Pending review"
          value={loading ? "—" : pendingCount}
          note="Waiting for verification"
          icon={Clock}
          tone="orange"
        />
        <StatCard
          label="Rejected"
          value={loading ? "—" : rejectedCount}
          note="Requires attention"
          icon={XCircle}
          tone="red"
        />
      </div>

      <Card className="overflow-hidden border-slate-200/80 py-0 gap-0 shadow-sm">
        <Tabs defaultValue="mine" className="gap-0">
          <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b border-slate-100 bg-transparent px-6 pt-4">
            <TabsTrigger
              value="mine"
              className="rounded-none border-b-2 border-transparent px-1 pb-3 text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
            >
              My documents
            </TabsTrigger>
            <TabsTrigger
              value="application"
              className="rounded-none border-b-2 border-transparent px-1 pb-3 text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
            >
              Application documents
            </TabsTrigger>
            <TabsTrigger
              value="shared"
              className="rounded-none border-b-2 border-transparent px-1 pb-3 text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
            >
              Shared documents
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col flex-wrap items-center gap-3 bg-slate-50/50 p-5 sm:flex-row">
          <Select defaultValue="all-apps">
            <SelectTrigger className="w-full bg-white sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-apps">All applications</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex max-w-full gap-2 overflow-x-auto">
            {TYPE_FILTERS.map((x) => (
              <button
                key={x}
                onClick={() => setTypeFilter(x)}
                className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  typeFilter === x
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {x}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:ml-auto sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents…"
              className="bg-white pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="pl-6">Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded on</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="py-4">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-slate-500"
                >
                  <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((d) => (
                <TableRow key={d.id} className="hover:bg-slate-50/60">
                  <TableCell className="pl-6">
                    <p
                      className="max-w-[200px] truncate font-semibold text-slate-900 sm:max-w-[300px]"
                      title={d.originalFileName}
                    >
                      {d.originalFileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatBytes(d.sizeBytes)} ·{" "}
                      {d.mimeType
                        ? d.mimeType.split("/")[1]?.toUpperCase() || "FILE"
                        : "FILE"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-blue-100 bg-blue-50 text-blue-700"
                    >
                      {d.documentType.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(d.status)}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        aria-label="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="More actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="relative overflow-hidden border-emerald-100 bg-emerald-50/50">
          <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-10">
            <ShieldCheck className="h-24 w-24 text-emerald-600" />
          </div>
          <CardContent className="relative z-10 p-6">
            <div className="mb-2 flex items-center gap-3 font-semibold text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
              Your documents are secure
            </div>
            <p className="max-w-md text-sm leading-relaxed text-emerald-700/80">
              We use bank-level encryption (AES-256) to keep your documents safe
              and private. Documents are only shared with authorities when you
              submit an application.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <HardDrive className="h-4 w-4 text-slate-400" />
              Storage usage
            </div>
            <p className="mb-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-900">
                {formatBytes(totalSizeBytes)}
              </span>{" "}
              used of 5 GB
            </p>
            <Progress value={storagePercent} className="mb-5 h-2" />
            <Button variant="outline" className="w-full">
              Upgrade storage
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
