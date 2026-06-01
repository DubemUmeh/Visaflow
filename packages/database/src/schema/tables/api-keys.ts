import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(), // SHA-256 of the actual key
    prefix: text("prefix").notNull(), // First 8 chars shown to user e.g., "vf_live_"
    permissions: text("permissions").array().notNull().default([]), // e.g., ["applications:read", "applications:write"]
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdById: uuid("created_by_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("api_keys_key_hash_idx").on(t.keyHash),
    index("api_keys_is_active_idx").on(t.isActive),
  ]
);