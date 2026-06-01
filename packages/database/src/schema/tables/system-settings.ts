import { json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: json("value").notNull(),
  description: text("description"),
  updatedById: uuid("updated_by_id"),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});