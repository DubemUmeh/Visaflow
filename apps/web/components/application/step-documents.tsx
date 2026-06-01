'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useApplicationWizardStore } from '@/store/application.store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';

const REQUIRED_DOCS = [
  { type: 'PASSPORT_SCAN',   label: 'Passport Scan',      desc: 'Data page of your passport', required: true },
  { type: 'PASSPORT_PHOTO',  label: 'Passport Photo',     desc: '2x2 inch white background photo', required: true },
  { type: 'BANK_STATEMENT',  label: 'Bank Statement',     desc: 'Last 3 months, showing sufficient funds', required: true },
  { type: 'TRAVEL_INSURANCE',label: 'Travel Insurance',   desc: 'Valid for the entire trip duration', required: false },
  { type: 'FLIGHT_BOOKING',  label: 'Flight Booking',     desc: 'Confirmed round-trip booking', required: false },
  { type: 'HOTEL_BOOKING',   label: 'Hotel Booking',      desc: 'Accommodation confirmation', required: false },
];

interface UploadedFile {
  docType: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  preview?: string;
}

function DocDropzone({ doc, uploaded, onUpload }: {
  doc: typeof REQUIRED_DOCS[0];
  uploaded: UploadedFile | undefined;
  onUpload: (docType: string, file: File) => void;
}) {
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) onUpload(doc.type, files[0]);
  }, [doc.type, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
  });

  return (
    <div className={cn('rounded-xl border-2 transition-all', uploaded ? 'border-green-300' : 'border-gray-200')}>
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {uploaded ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : doc.required ? (
            <div className="w-4 h-4 rounded-full border-2 border-red-300 bg-red-50" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{doc.label}</p>
            <p className="text-xs text-gray-500">{doc.desc}</p>
          </div>
        </div>
        {doc.required && !uploaded && (
          <span className="text-xs text-red-500 font-medium">Required</span>
        )}
        {!doc.required && !uploaded && (
          <span className="text-xs text-gray-400">Optional</span>
        )}
      </div>

      {uploaded ? (
        <div className="flex items-center gap-3 p-3">
          <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{uploaded.file.name}</p>
            <p className="text-xs text-gray-400">{(uploaded.file.size / 1024).toFixed(0)} KB</p>
          </div>
          {uploaded.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          {uploaded.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          {uploaded.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center p-6 cursor-pointer transition-colors',
            isDragActive ? 'bg-blue-50' : 'hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 text-center">
            {isDragActive ? 'Drop here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
        </div>
      )}
    </div>
  );
}

export default function StepDocuments() {
  const { nextStep, prevStep, applicationId } = useApplicationWizardStore();
  const [uploads, setUploads] = useState<UploadedFile[]>([]);

  const handleUpload = async (docType: string, file: File) => {
    setUploads(prev => {
      const existing = prev.filter(u => u.docType !== docType);
      return [...existing, { docType, file, status: 'uploading' }];
    });

    try {
      const { data } = await api.post('/documents/upload-url', {
        applicationId,
        documentType: docType,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });

      await api.post('/documents/confirm', {
        documentId: data.data.documentId,
        storageKey: data.data.fields?.storageKey,
      });

      setUploads(prev => prev.map(u => u.docType === docType ? { ...u, status: 'done' } : u));
      toast.success(`${REQUIRED_DOCS.find(d => d.type === docType)?.label} uploaded`);
    } catch {
      setUploads(prev => prev.map(u => u.docType === docType ? { ...u, status: 'error' } : u));
      toast.error('Upload failed. Please try again.');
    }
  };

  const requiredDocs = REQUIRED_DOCS.filter(d => d.required);
  const uploadedRequired = uploads.filter(u =>
    requiredDocs.some(d => d.type === u.docType) && u.status === 'done'
  );
  const allRequiredDone = uploadedRequired.length >= requiredDocs.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 text-lg mb-1">Upload Documents</h2>
            <p className="text-sm text-gray-500">
              Upload the required documents. Make sure all documents are clear, legible and not expired.
            </p>
          </div>

          <div className="space-y-3">
            {REQUIRED_DOCS.map(doc => (
              <DocDropzone
                key={doc.type}
                doc={doc}
                uploaded={uploads.find(u => u.docType === doc.type)}
                onUpload={handleUpload}
              />
            ))}
          </div>

          {!allRequiredDone && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{requiredDocs.length - uploadedRequired.length} required document(s) still needed.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep} className="gap-1">
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
