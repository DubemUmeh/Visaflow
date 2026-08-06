import { index, integer, json, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { depositStatusEnum } from "../enums/deposit-status";
import { wallets } from "./wallets";

export const deposits = pgTable(
  "deposits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id),
    userId: uuid("user_id").notNull(),
    walletAddressId: uuid("wallet_address_id").notNull(),
    transactionHash: text("transaction_hash").notNull(),
    network: text("network").notNull(),
    asset: text("asset").notNull(),
    amount: integer("amount").notNull(),
    confirmations: integer("confirmations").notNull().default(0),
    status: depositStatusEnum("status").notNull().default("PENDING"),
    creditedTransactionId: uuid("credited_transaction_id"),
    metadata: json("metadata").notNull().default({}),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    index("deposits_wallet_id_idx").on(t.walletId),
    index("deposits_user_id_idx").on(t.userId),
    index("deposits_status_idx").on(t.status),
    uniqueIndex("deposits_network_tx_hash_idx").on(t.network, t.transactionHash),
  ],
);
