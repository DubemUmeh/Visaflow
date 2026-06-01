import { boolean, index, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const contentPages = pgTable(
  "content_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    content: json("content").notNull(), // Rich content blocks (JSON)
    locale: text("locale").notNull().default("en"),
    pageType: text("page_type").notNull(), // "faq", "help", "landing", "legal"
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("content_pages_slug_idx").on(t.slug),
    index("content_pages_page_type_idx").on(t.pageType),
    index("content_pages_locale_idx").on(t.locale),
  ]
);