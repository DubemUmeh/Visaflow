import path from "node:path";
import { existsSync } from "node:fs";
import dotenv from 'dotenv';
import type { Config } from "drizzle-kit";

const cwd = process.cwd();
const envFiles = [
  path.resolve(cwd, ".env"),
  path.resolve(cwd, ".env.local"),
  path.resolve(cwd, "../../.env"),
  path.resolve(cwd, "../../.env.local"),
  path.resolve(cwd, "packages/database/.env"),
  path.resolve(cwd, "../../packages/database/.env"),
];

for (const envFile of new Set(envFiles)) {
  if (existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString);

  // `schema` is a Prisma-style query param. Drizzle/Postgres use `public`
  // by default, and postgres drivers can reject this as an unknown setting.
  url.searchParams.delete("schema");

  return url.toString();
}

export default {
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: 'postgresql',
  dbCredentials: {
    url: normalizeConnectionString(process.env.DATABASE_URL),
  },
} satisfies Config;
