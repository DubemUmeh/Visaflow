import { pgEnum } from "drizzle-orm/pg-core";

export const authProviderEnum = pgEnum("AuthProvider", [
  "LOCAL",
  "GOOGLE",
  "APPLE",
]);