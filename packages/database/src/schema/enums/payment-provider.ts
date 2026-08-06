import { pgEnum } from "drizzle-orm/pg-core";

export const paymentProviderEnum = pgEnum("PaymentProvider", [
  "WALLET",
  "PAYPAL",
]);
