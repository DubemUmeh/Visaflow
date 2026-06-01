import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const countries = pgTable(
  "countries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    code: text("code").notNull().unique(), // ISO 3166-1 alpha-2 (e.g., "US")
    code3: text("code3").notNull().unique(), // ISO 3166-1 alpha-3 (e.g., "USA")
    capital: text("capital"),
    region: text("region"), // e.g., "Europe", "Asia"
    subregion: text("subregion"), // e.g., "Western Europe"
    flagEmoji: text("flag_emoji"),
    flagImageUrl: text("flag_image_url"),
    phoneCode: text("phone_code"),
    currency: text("currency"),
    currencySymbol: text("currency_symbol"),
    languages: text("languages").array().notNull().default([]),

    // SEO / CMS
    slug: text("slug").notNull().unique(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    heroImageUrl: text("hero_image_url"),
    overview: text("overview"),
    travelTips: text("travel_tips"),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),

    // Stats (denormalized for performance)
    visaTypesCount: integer("visa_types_count").notNull().default(0),
    avgProcessingDays: integer("avg_processing_days"),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("countries_code_idx").on(t.code),
    index("countries_code3_idx").on(t.code3),
    index("countries_slug_idx").on(t.slug),
    index("countries_region_idx").on(t.region),
    index("countries_is_published_idx").on(t.isPublished),
    index("countries_deleted_at_idx").on(t.deletedAt),
  ]
);