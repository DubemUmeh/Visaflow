import { pgEnum } from "drizzle-orm/pg-core";

export const notificationChannelEnum = pgEnum("NotificationChannel", [
  "EMAIL",
  "SMS",
  "IN_APP",
  "PUSH",
]);