"use client";
import React, { useEffect, useState } from "react";
import { 
  FileText, CheckCircle, Clock, XCircle, Search, 
  Upload, Download, MoreHorizontal, ShieldCheck, HardDrive
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { UploadedDocumentEntity } from "@visaflow/shared-types";

// Helper components for stats
function StatCard({ label, value, note, icon: Icon, tone }: { label: string, value: string | number, note: string, icon: any, tone?: 'green' | 'orange' | 'red' }) {
  const colorClass = 
    tone === 'green' ? 'text-emerald-600 bg-emerald-50' : 
    tone === 'orange' ? 'text-orange-600 bg-orange-50' : 
    tone === 'red' ? 'text-red-600 bg-red-50' : 
    'text-blue-600 bg-blue-50';

  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{note}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'VERIFIED':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Verified</Badge>;
    case 'PROCESSING':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Processing</Badge>;
    case 'UPLOADING':
      return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-0">Uploading</Badge>;
    case 'PENDING':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">Pending Review</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Rejected</Badge>;
    case 'EXPIRED':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-0">Expired</Badge>;
    default:
      return <Badge variant="outline" className="text-slate-600 border-slate-200">{status || 'Unknown'}</Badge>;
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UploadedDocumentEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");

  useEffect(() => {
    api.get("/documents")
      .then(res => {
        setDocuments(getResponseItems<UploadedDocumentEntity>(res.data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verifiedCount = documents.filter(d => d.status === 'VERIFIED').length;
  const pendingCount = documents.filter(d => d.status === 'PENDING' || d.status === 'PROCESSING' || d.status === 'UPLOADING').length;
  const rejectedCount = documents.filter(d => d.status === 'REJECTED').length;
  
  const totalSizeBytes = documents.reduce((acc, doc) => acc + (doc.sizeBytes || 0), 0);
  const storageLimitBytes = 5 * 1024 * 1024 * 1024; // 5 GB
  const storagePercent = Math.min(100, Math.round((totalSizeBytes / storageLimitBytes) * 100));

  const filteredDocs = documents.filter(doc => {
    if (typeFilter !== "All Types") {
      const docType = (doc.documentType || '').toUpperCase();
      const filter = typeFilter.toUpperCase();
      if (!docType.includes(filter)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (doc.originalFileName || doc.fileName || '').toLowerCase();
      const type = (doc.documentType || '').toLowerCase();
      return name.includes(q) || type.includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="mt-1 text-slate-500">Manage and upload documents for your visa applications.</p>
        </div>
        <Button className="gap-2 shrink-0">
          <Upload className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Documents" value={loading ? "-" : documents.length} note="Across all applications" icon={FileText} />
        <StatCard label="Verified Documents" value={loading ? "-" : verifiedCount} note="Documents verified" icon={CheckCircle} tone="green" />
        <StatCard label="Pending Review" value={loading ? "-" : pendingCount} note="Waiting for verification" icon={Clock} tone="orange" />
        <StatCard label="Rejected Documents" value={loading ? "-" : rejectedCount} note="Requires attention" icon={XCircle} tone="red" />
      </div>

      <Card className="overflow-hidden border-slate-200">
        <div className="flex gap-6 border-b border-slate-100 px-6 pt-4 text-sm font-medium overflow-x-auto hide-scrollbar">
          <button className="border-b-2 border-blue-600 pb-3 text-blue-600 whitespace-nowrap">My Documents</button>
          <button className="pb-3 text-slate-500 hover:text-slate-700 whitespace-nowrap">Application Documents</button>
          <button className="pb-3 text-slate-500 hover:text-slate-700 whitespace-nowrap">Shared Documents</button>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 p-5 bg-slate-50/50">
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]">
            <option>All Applications</option>
          </select>
          
          <div className="flex overflow-x-auto gap-2 hide-scrollbar max-w-full">
            {["All Types", "PASSPORT", "FINANCIAL", "TRAVEL", "OTHER"].map(x => (
              <button 
                key={x} 
                onClick={() => setTypeFilter(x)}
                className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors whitespace-nowrap ${typeFilter === x ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {x}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto w-full sm:w-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-y border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Uploaded On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading documents...</td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    No documents found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[300px]" title={d.originalFileName}>
                        {d.originalFileName}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatBytes(d.sizeBytes)} • {d.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                        {d.documentType.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="bg-emerald-50/50 border-emerald-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck className="w-24 h-24 text-emerald-600" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3 text-emerald-700 font-semibold mb-2">
              <ShieldCheck className="w-5 h-5" />
              Your documents are secure
            </div>
            <p className="text-sm text-emerald-700/80 max-w-md leading-relaxed">
              We use bank-level encryption (AES-256) to keep your documents safe and private. Documents are only shared with authorities when you submit an application.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <HardDrive className="w-4 h-4 text-slate-400" />
              Storage Usage
            </div>
            <p className="text-sm text-slate-500 mb-2">
              <span className="font-semibold text-slate-900">{formatBytes(totalSizeBytes)}</span> used of 5 GB
            </p>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
              <div 
                className="h-full rounded-full bg-blue-600 transition-all duration-1000" 
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <Button variant="outline" className="w-full">
              Upgrade Storage
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
