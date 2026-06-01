import { pgEnum } from "drizzle-orm/pg-core";

export const applicationStatusEnum = pgEnum("ApplicationStatus", [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "MISSING_DOCUMENTS",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
]);