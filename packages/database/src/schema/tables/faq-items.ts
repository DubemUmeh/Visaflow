import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const faqItems = pgTable(
  "faq_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: text("category").notNull().default("general"),
    sortOrder: integer("sort_order").notNull().default(0),
    locale: text("locale").notNull().default("en"),
    isPublished: boolean("is_published").notNull().default(true),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("faq_items_category_idx").on(t.category),
    index("faq_items_locale_idx").on(t.locale),
  ]
);