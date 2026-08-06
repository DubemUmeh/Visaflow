import { pgEnum } from "drizzle-orm/pg-core";

export const walletTransactionTypeEnum = pgEnum("WalletTransactionType", [
  "DEPOSIT",
  "PAYMENT",
  "REFUND",
  "ADJUSTMENT",
]);
