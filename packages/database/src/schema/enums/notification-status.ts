import { pgEnum } from "drizzle-orm/pg-core";

export const notificationStatusEnum = pgEnum("NotificationStatus", [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "READ",
]);