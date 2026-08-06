import { index, integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { paymentProviderEnum } from "../enums/payment-provider";
import { paymentStatusEnum } from "../enums/payment-status";
import { processingTierEnum } from "../enums/processing-tier";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    applicationId: uuid("application_id").notNull(),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    provider: paymentProviderEnum("provider").notNull().default("WALLET"),

    // Amounts (in smallest currency unit, e.g., cents)
    amountTotal: integer("amount_total").notNull(),
    amountGovFee: integer("amount_gov_fee").notNull().default(0),
    amountServiceFee: integer("amount_service_fee").notNull(),
    amountTax: integer("amount_tax").notNull().default(0),
    amountRefunded: integer("amount_refunded").notNull().default(0),
    currency: text("currency").notNull().default("USD"),

    // Provider-specific
    providerPaymentId: text("provider_payment_id").unique(), // Wallet transaction ID or PayPal Order ID
    providerCustomerId: text("provider_customer_id"), // Payment provider customer ID
    providerSessionId: text("provider_session_id"), // Payment provider session ID
    providerRefundId: text("provider_refund_id"),

    // Metadata
    processingTier: processingTierEnum("processing_tier")
      .notNull()
      .default("STANDARD"),
    description: text("description"),
    receiptUrl: text("receipt_url"),
    invoiceUrl: text("invoice_url"),
    failureReason: text("failure_reason"),
    metadata: json("metadata").notNull().default({}),

    // Timestamps
    paidAt: timestamp("paid_at"),
    refundedAt: timestamp("refunded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("payments_user_id_idx").on(t.userId),
    index("payments_application_id_idx").on(t.applicationId),
    index("payments_status_idx").on(t.status),
    index("payments_provider_payment_id_idx").on(t.providerPaymentId),
    index("payments_created_at_idx").on(t.createdAt),
  ]
);