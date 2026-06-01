import { pgEnum } from "drizzle-orm/pg-core";

export const processingTierEnum = pgEnum("ProcessingTier", [
  "STANDARD",
  "EXPEDITED",
  "RUSH",
]);