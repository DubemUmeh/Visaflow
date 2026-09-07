import { pgEnum } from "drizzle-orm/pg-core";

export const paymentProviderEnum = pgEnum("PaymentProvider", [
  "STRIPE",
  "WALLET",
  "PAYPAL",
]);
