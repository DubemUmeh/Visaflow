import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const eligibilityRules = pgTable(
  "eligibility_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    destinationCountryId: uuid("destination_country_id").notNull(),
    nationalityCountryId: uuid("nationality_country_id").notNull(),
    visaTypeId: uuid("visa_type_id"),
    isVisaRequired: boolean("is_visa_required").notNull().default(true),
    isVisaOnArrival: boolean("is_visa_on_arrival").notNull().default(false),
    isEVisa: boolean("is_e_visa").notNull().default(false),
    stayDurationDays: integer("stay_duration_days"),
    notes: text("notes"),
    sourceUrl: text("source_url"),
    lastVerifiedAt: timestamp("last_verified_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("eligibility_rules_dest_nat_idx").on(
      t.destinationCountryId,
      t.nationalityCountryId
    ),
    index("eligibility_rules_destination_country_id_idx").on(
      t.destinationCountryId
    ),
    index("eligibility_rules_nationality_country_id_idx").on(
      t.nationalityCountryId
    ),
  ]
);