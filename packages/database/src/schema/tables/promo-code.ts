import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    description: text("description"),
    discountType: text("discount_type").notNull(), // "PERCENTAGE" | "FIXED_AMOUNT"
    discountValue: integer("discount_value").notNull(), // % or cents
    maxUses: integer("max_uses"),
    currentUses: integer("current_uses").notNull().default(0),
    minOrderAmount: integer("min_order_amount"), // in cents
    applicableVisaTypeIds: text("applicable_visa_type_ids")
      .array()
      .notNull()
      .default([]), // empty = all
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("promo_codes_code_idx").on(t.code),
    index("promo_codes_is_active_idx").on(t.isActive),
  ]
);