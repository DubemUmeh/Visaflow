import { pgEnum } from "drizzle-orm/pg-core";

export const supportTicketStatusEnum = pgEnum("SupportTicketStatus", [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);