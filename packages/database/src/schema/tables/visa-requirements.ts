import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { documentTypeEnum } from "../enums/document-type";

export const visaRequirements = pgTable(
  "visa_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visaTypeId: uuid("visa_type_id").notNull(),
    documentType: documentTypeEnum("document_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isRequired: boolean("is_required").notNull().default(true),
    isOptional: boolean("is_optional").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    helpText: text("help_text"),
    exampleUrl: text("example_url"),
    maxFileSizeMB: integer("max_file_size_mb").notNull().default(10),
    allowedFormats: text("allowed_formats")
      .array()
      .notNull()
      .default(["pdf", "jpg", "jpeg", "png"]),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("visa_requirements_visa_type_id_idx").on(t.visaTypeId)]
);