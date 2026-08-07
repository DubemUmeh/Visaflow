import { pgEnum } from "drizzle-orm/pg-core";

export const depositStatusEnum = pgEnum("DepositStatus", [
  "PENDING",
  "CONFIRMED",
  "FAILED",
]);
