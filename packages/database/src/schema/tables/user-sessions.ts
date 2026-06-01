import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("user_sessions_user_id_idx").on(t.userId),
    index("user_sessions_refresh_token_hash_idx").on(t.refreshTokenHash),
    index("user_sessions_expires_at_idx").on(t.expiresAt),
  ]
);