import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { supportTicketPriorityEnum } from "../enums/support-ticket-priority";
import { supportTicketStatusEnum } from "../enums/support-ticket-status";

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    applicationId: uuid("application_id"),
    assignedToId: uuid("assigned_to_id"),

    ticketNumber: text("ticket_number").notNull().unique(), // e.g., TKT-2024-001234
    subject: text("subject").notNull(),
    status: supportTicketStatusEnum("status").notNull().default("OPEN"),
    priority: supportTicketPriorityEnum("priority").notNull().default("MEDIUM"),
    category: text("category").notNull().default("general"),

    // Contact info for guest tickets
    guestEmail: text("guest_email"),
    guestName: text("guest_name"),

    // Resolution
    resolvedAt: timestamp("resolved_at"),
    closedAt: timestamp("closed_at"),
    firstResponseAt: timestamp("first_response_at"),

    // Timestamps
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("support_tickets_user_id_idx").on(t.userId),
    index("support_tickets_status_idx").on(t.status),
    index("support_tickets_priority_idx").on(t.priority),
    index("support_tickets_ticket_number_idx").on(t.ticketNumber),
    index("support_tickets_assigned_to_id_idx").on(t.assignedToId),
    index("support_tickets_deleted_at_idx").on(t.deletedAt),
  ]
);