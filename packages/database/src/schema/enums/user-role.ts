import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("UserRole", [
  "APPLICANT",
  "AGENT",
  "ADMIN",
  "SUPER_ADMIN",
]);