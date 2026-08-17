"use client";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useApplicationWizardStore } from "@/store/application.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import type { ApplicationEntity } from "@visaflow/shared-types";

// All type values must match the API's RequestUploadUrlDto enum exactly
const REQUIRED_DOCS = [
  {
    type: "PASSPORT_COPY",
    label: "Passport Copy",
    desc: "Data page of your passport",
    required: true,
  },
  {
    type: "PASSPORT_PHOTO",
    label: "Passport Photo",
    desc: "2x2 inch white background photo",
    required: true,
  },
  {
    type: "BANK_STATEMENT",
    label: "Bank Statement",
    desc: "Last 3 months, showing sufficient funds",
    required: true,
  },
  {
    type: "TRAVEL_INSURANCE",
    label: "Travel Insurance",
    desc: "Valid for the entire trip duration",
    required: false,
  },
  {
    type: "FLIGHT_ITINERARY",
    label: "Flight Booking",
    desc: "Confirmed round-trip booking",
    required: false,
  },
  {
    type: "HOTEL_BOOKING",
    label: "Hotel Booking",
    desc: "Accommodation confirmation",
    required: false,
  },
];

interface UploadedFile {
  docType: string;
  file: File;
  status: "pending" | "uploading" | "confirming" | "done" | "error";
  progress: number;
  documentId?: string;
  storageKey?: string;
}

function DocDropzone({
  doc,
  uploaded,
  onUpload,
}: {
  doc: (typeof REQUIRED_DOCS)[0];
  uploaded: UploadedFile | undefined;
  onUpload: (docType: string, file: File) => void;
}) {
  const onDrop = useCallback(
    (files: File[]) => {
      if (files[0]) onUpload(doc.type, files[0]);
    },
    [doc.type, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
  });

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all",
        uploaded ? "border-success/40" : "border-border",
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          {uploaded ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : doc.required ? (
            <div className="w-4 h-4 rounded-full border-2 border-red-300 bg-destructive/10" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-border" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{doc.label}</p>
            <p className="text-xs text-muted-foreground">{doc.desc}</p>
          </div>
        </div>
        {doc.required && !uploaded && (
          <span className="text-xs text-destructive font-medium">Required</span>
        )}
        {!doc.required && !uploaded && (
          <span className="text-xs text-muted-foreground/70">Optional</span>
        )}
      </div>

      {uploaded ? (
        <div className="flex items-center gap-3 p-3">
          <FileText className="w-8 h-8 text-muted-foreground/70 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {uploaded.file.name}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {(uploaded.file.size / 1024).toFixed(0)} KB ·{" "}
              {uploaded.status === "uploading"
                ? `${uploaded.progress}%`
                : uploaded.status}
            </p>
          </div>
          {(uploaded.status === "uploading" ||
            uploaded.status === "confirming") && (
            <Loader2 className="w-4 h-4 animate-spin text-coral" />
          )}
          {uploaded.status === "done" && (
            <CheckCircle2 className="w-4 h-4 text-success" />
          )}
          {uploaded.status === "error" && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center p-6 cursor-pointer transition-colors",
            isDragActive ? "bg-brand-soft" : "hover:bg-sand/45",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-6 h-6 text-muted-foreground/70 mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            {isDragActive ? "Drop here" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground/70">
            PDF, JPG, PNG up to 10 MB
          </p>
        </div>
      )}
    </div>
  );
}

export default function StepDocuments() {
  const { nextStep, prevStep, applicationId } = useApplicationWizardStore();
  const [uploads, setUploads] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (!applicationId) return;

    let cancelled = false;
    api.get(`/applications/${applicationId}`).then(({ data }) => {
      if (cancelled) return;
      const application = (data.data ?? data) as ApplicationEntity;
      const existingUploads = application.documents
        .filter((doc) => ["PROCESSING", "VERIFIED"].includes(doc.status))
        .map((doc) => ({
          docType: doc.documentType,
          file: new File([], doc.originalFileName),
          status: "done" as const,
          progress: 100,
          documentId: doc.id,
        }));
      setUploads(existingUploads);
    });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const uploadToR2 = (
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress: (progress: number) => void,
  ) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable)
          onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error("R2 upload failed"));
      xhr.onerror = () => reject(new Error("R2 upload failed"));
      xhr.send(file);
    });

  const handleUpload = async (docType: string, file: File) => {
    if (!applicationId) {
      toast.error("Create the application draft before uploading documents.");
      return;
    }

    setUploads((prev) => [
      ...prev.filter((u) => u.docType !== docType),
      { docType, file, status: "uploading", progress: 0 },
    ]);

    try {
      const contentType = file.type || "application/octet-stream";
      const { data } = await api.post("/documents/upload-url", {
        applicationId,
        documentType: docType,
        fileName: file.name,
        mimeType: contentType,
        sizeBytes: file.size,
      });
      const payload = data.data ?? data;

      await uploadToR2(payload.uploadUrl, file, contentType, (progress) => {
        setUploads((prev) =>
          prev.map((u) => (u.docType === docType ? { ...u, progress } : u)),
        );
      });

      setUploads((prev) =>
        prev.map((u) =>
          u.docType === docType
            ? {
                ...u,
                status: "confirming",
                progress: 100,
                documentId: payload.documentId,
                storageKey: payload.objectKey,
              }
            : u,
        ),
      );
      await api.post("/documents/confirm", {
        documentId: payload.documentId,
        storageKey: payload.objectKey,
      });

      setUploads((prev) =>
        prev.map((u) =>
          u.docType === docType ? { ...u, status: "done", progress: 100 } : u,
        ),
      );
      toast.success(
        `${REQUIRED_DOCS.find((d) => d.type === docType)?.label} uploaded`,
      );
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.docType === docType ? { ...u, status: "error" } : u,
        ),
      );
      toast.error("Upload failed. Please try again.");
    }
  };

  const requiredDocs = REQUIRED_DOCS.filter((d) => d.required);
  const uploadedRequired = uploads.filter(
    (u) =>
      requiredDocs.some((d) => d.type === u.docType) && u.status === "done",
  );
  const allRequiredDone = uploadedRequired.length >= requiredDocs.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-foreground text-lg mb-1">
              Upload Documents
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload the required documents. Make sure all documents are clear,
              legible and not expired.
            </p>
          </div>

          <div className="space-y-3">
            {REQUIRED_DOCS.map((doc) => (
              <DocDropzone
                key={doc.type}
                doc={doc}
                uploaded={uploads.find((u) => u.docType === doc.type)}
                onUpload={handleUpload}
              />
            ))}
          </div>

          {!allRequiredDone && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {requiredDocs.length - uploadedRequired.length} required
                document(s) still needed.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={nextStep}>
            Skip for now
          </Button>
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="gap-2"
            onClick={nextStep}
            disabled={!allRequiredDone}
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
