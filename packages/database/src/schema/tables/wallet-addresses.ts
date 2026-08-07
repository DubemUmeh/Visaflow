import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { wallets } from "./wallets";

export const walletAddresses = pgTable(
  "wallet_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id),
    userId: uuid("user_id").notNull(),
    network: text("network").notNull(),
    asset: text("asset").notNull(),
    address: text("address").notNull(),
    provider: text("provider").notNull().default("INTERNAL_EVM"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("wallet_addresses_wallet_id_idx").on(t.walletId),
    index("wallet_addresses_user_id_idx").on(t.userId),
    uniqueIndex("wallet_addresses_network_address_idx").on(t.network, t.address),
  ],
);
