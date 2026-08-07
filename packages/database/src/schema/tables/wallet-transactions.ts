import { index, integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { walletTransactionTypeEnum } from "../enums/wallet-transaction-type";
import { wallets } from "./wallets";

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id),
    userId: uuid("user_id").notNull(),
    type: walletTransactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    currency: text("currency").notNull().default("USD"),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    description: text("description").notNull(),
    metadata: json("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("wallet_transactions_wallet_id_idx").on(t.walletId),
    index("wallet_transactions_user_id_idx").on(t.userId),
    index("wallet_transactions_reference_idx").on(t.referenceType, t.referenceId),
    index("wallet_transactions_created_at_idx").on(t.createdAt),
  ],
);
