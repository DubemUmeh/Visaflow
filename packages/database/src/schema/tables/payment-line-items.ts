import { index, integer, json, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const paymentLineItems = pgTable(
  "payment_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id").notNull(),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmount: integer("unit_amount").notNull(), // in cents
    totalAmount: integer("total_amount").notNull(),
    currency: text("currency").notNull().default("USD"),
    metadata: json("metadata").notNull().default({}),
  },
  (t) => [index("payment_line_items_payment_id_idx").on(t.paymentId)]
);