import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id").notNull(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    contentHtml: text("content_html"),

    // SEO
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    ogImageUrl: text("og_image_url"),
    canonicalUrl: text("canonical_url"),

    // Taxonomy
    categories: text("categories").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    locale: text("locale").notNull().default("en"),

    // Publishing
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    featuredImageUrl: text("featured_image_url"),
    isFeatured: boolean("is_featured").notNull().default(false),
    readTimeMinutes: integer("read_time_minutes"),

    // Stats
    viewCount: integer("view_count").notNull().default(0),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("blog_posts_slug_idx").on(t.slug),
    index("blog_posts_author_id_idx").on(t.authorId),
    index("blog_posts_is_published_idx").on(t.isPublished),
    index("blog_posts_published_at_idx").on(t.publishedAt),
    index("blog_posts_locale_idx").on(t.locale),
    index("blog_posts_deleted_at_idx").on(t.deletedAt),
  ]
);