import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { documentStatusEnum } from "../enums/document-status";
import { documentTypeEnum } from "../enums/document-type";
import { applications } from "./applications";

export const uploadedDocuments = pgTable(
  "uploaded_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    documentType: documentTypeEnum("document_type").notNull(),
    status: documentStatusEnum("status").notNull().default("PENDING"),

    // File metadata
    fileName: text("file_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksum: text("checksum"), // SHA-256 for integrity verification

    // Storage
    storageKey: text("storage_key").notNull(), // S3-compatible key
    storageBucket: text("storage_bucket").notNull(),
    storageRegion: text("storage_region").notNull().default("us-east-1"),
    cdnUrl: text("cdn_url"), // CloudFront/CDN URL
    thumbnailUrl: text("thumbnail_url"),

    // OCR / AI extraction
    ocrProcessed: boolean("ocr_processed").notNull().default(false),
    ocrData: json("ocr_data"), // Extracted fields
    ocrConfidence: real("ocr_confidence"), // 0-1 confidence score
    aiSuggestions: json("ai_suggestions"), // Suggested form autofill values

    // Security
    virusScanStatus: text("virus_scan_status").notNull().default("PENDING"), // PENDING, CLEAN, INFECTED, ERROR
    virusScannedAt: timestamp("virus_scanned_at"),
    isEncrypted: boolean("is_encrypted").notNull().default(true),

    // Validation
    rejectionReason: text("rejection_reason"),
    reviewedById: uuid("reviewed_by_id"),
    reviewedAt: timestamp("reviewed_at"),

    // Expiry (passport, visa, etc.)
    documentExpiryDate: timestamp("document_expiry_date"),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("uploaded_docs_user_id_idx").on(t.userId),
    index("uploaded_docs_application_id_idx").on(t.applicationId),
    index("uploaded_docs_document_type_idx").on(t.documentType),
    index("uploaded_docs_status_idx").on(t.status),
    index("uploaded_docs_virus_scan_status_idx").on(t.virusScanStatus),
    index("uploaded_docs_deleted_at_idx").on(t.deletedAt),
  ],
);
