import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { visaEntryTypeEnum } from "../enums/visa-entry-type";
import { visaCategoryEnum } from "../enums/visa-category";

export const visaTypes = pgTable(
  "visa_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    slug: text("slug").notNull().unique(),
    destinationCountryId: uuid("destination_country_id").notNull(),
    nationalityCountryId: uuid("nationality_country_id"),

    // Visa details
    category: visaCategoryEnum("category").notNull().default("OTHER"), // <- new
    entryType: visaEntryTypeEnum("entry_type").notNull().default("SINGLE"),
    stayDuration: integer("stay_duration"),
    validityPeriod: integer("validity_period"),
    description: text("description"),
    requirements: text("requirements"),
    notes: text("notes"),
    isVisaRequired: boolean("is_visa_required").notNull().default(true),
    isVisaOnArrival: boolean("is_visa_on_arrival").notNull().default(false),
    isEVisa: boolean("is_e_visa").notNull().default(true),

    // Processing
    processingDaysMin: integer("processing_days_min").notNull().default(3),
    processingDaysMax: integer("processing_days_max").notNull().default(10),
    processingDaysExpedited: integer("processing_days_expedited"),
    processingDaysRush: integer("processing_days_rush"),

    // Pricing (in USD cents to avoid float issues)
    priceStandard: integer("price_standard").notNull(),
    priceExpedited: integer("price_expedited"),
    priceRush: integer("price_rush"),
    govFee: integer("gov_fee").notNull().default(0),
    serviceFee: integer("service_fee").notNull(),

    // SEO / CMS
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    sortOrder: integer("sort_order").notNull().default(0),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("visa_types_dest_nat_entry_code_idx").on(
      t.destinationCountryId,
      t.nationalityCountryId,
      t.entryType,
      t.code,
    ),
    index("visa_types_destination_country_id_idx").on(t.destinationCountryId),
    index("visa_types_nationality_country_id_idx").on(t.nationalityCountryId),
    index("visa_types_slug_idx").on(t.slug),
    index("visa_types_is_published_idx").on(t.isPublished),
    index("visa_types_deleted_at_idx").on(t.deletedAt),
    index("visa_types_category_idx").on(t.category), // <- new, you'll filter by this a lot
  ],
);
