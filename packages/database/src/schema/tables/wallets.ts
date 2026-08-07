import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique(),
    balance: integer("balance").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
  },
  (t) => [index("wallets_user_id_idx").on(t.userId)],
);
