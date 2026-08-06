import { index, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    paymentId: uuid("payment_id"),
    applicationId: uuid("application_id"),
    eventType: text("event_type").notNull(),
    payload: json("payload").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("payment_events_user_id_idx").on(t.userId),
    index("payment_events_payment_id_idx").on(t.paymentId),
    index("payment_events_created_at_idx").on(t.createdAt),
  ],
);
