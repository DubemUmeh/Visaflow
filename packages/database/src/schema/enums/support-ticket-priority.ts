import { pgEnum } from "drizzle-orm/pg-core";

export const supportTicketPriorityEnum = pgEnum("SupportTicketPriority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);