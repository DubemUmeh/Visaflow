import { pgEnum } from "drizzle-orm/pg-core";

export const paymentStatusEnum = pgEnum("PaymentStatus", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);