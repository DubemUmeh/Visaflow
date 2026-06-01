import { pgEnum } from "drizzle-orm/pg-core";

export const documentStatusEnum = pgEnum("DocumentStatus", [
  "PENDING",
  "UPLOADING",
  "PROCESSING",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
]);