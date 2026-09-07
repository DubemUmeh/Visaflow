import { index, integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { applicationStatusEnum } from "../enums/application-status";
import { processingTierEnum } from "../enums/processing-tier";

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceNumber: text("reference_number").notNull().unique(), // e.g., VF-2024-001234
    userId: uuid("user_id").notNull(),
    visaTypeId: uuid("visa_type_id").notNull(),
    destinationCountryId: uuid("destination_country_id"),
    nationalityCountryId: uuid("nationality_country_id"),

    // Status & Tracking
    status: applicationStatusEnum("status").notNull().default("DRAFT"),
    processingTier: processingTierEnum("processing_tier")
      .notNull()
      .default("STANDARD"),
    currentStep: integer("current_step").notNull().default(1),
    totalSteps: integer("total_steps").notNull().default(5),
    completionPercentage: integer("completion_percentage").notNull().default(0),

    // Dates
    submittedAt: timestamp("submitted_at"),
    reviewStartedAt: timestamp("review_started_at"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at"),
    travelDateFrom: timestamp("travel_date_from"),
    travelDateTo: timestamp("travel_date_to"),

    // Applicant details (snapshot at time of application)
    applicantFirstName: text("applicant_first_name"),
    applicantLastName: text("applicant_last_name"),
    applicantEmail: text("applicant_email"),
    applicantPhone: text("applicant_phone"),
    applicantDob: timestamp("applicant_dob"),
    applicantPassportNo: text("applicant_passport_no"),
    applicantPassportExpiry: timestamp("applicant_passport_expiry"),

    // Form data (dynamic JSON based on visa type requirements)
    formData: json("form_data").notNull().default({}),
    draftData: json("draft_data").notNull().default({}), // autosave
    lastDraftSavedAt: timestamp("last_draft_saved_at"),

    // Admin notes
    internalNotes: text("internal_notes"),
    rejectionReason: text("rejection_reason"),
    missingDocumentsNote: text("missing_documents_note"),

    // Assigned agent/admin
    assignedToId: uuid("assigned_to_id"),
    assignedAt: timestamp("assigned_at"),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("applications_user_id_idx").on(t.userId),
    index("applications_visa_type_id_idx").on(t.visaTypeId),
    index("applications_status_idx").on(t.status),
    index("applications_reference_number_idx").on(t.referenceNumber),
    index("applications_destination_country_id_idx").on(t.destinationCountryId),
    index("applications_nationality_country_id_idx").on(t.nationalityCountryId),
    index("applications_submitted_at_idx").on(t.submittedAt),
    index("applications_assigned_to_id_idx").on(t.assignedToId),
    index("applications_deleted_at_idx").on(t.deletedAt),
  ]
);