import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getConfig } from "./environments";

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

function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  const schema = url.searchParams.get("schema") ?? undefined;

  // `schema` is a Prisma-style query param. postgres-js forwards unknown
  // params as PostgreSQL settings, where `schema` is invalid.
  url.searchParams.delete("schema");

  return {
    url: url.toString(),
    schema,
  };
}

// Get environment-specific configuration
const config = getConfig();

// Database connection config
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const databaseConnection = normalizeConnectionString(connectionString);
const schemaConnectionConfig = databaseConnection.schema
  ? { connection: { search_path: databaseConnection.schema } }
  : {};

// Client for migrations
export const migrationClient = postgres(databaseConnection.url, { 
  max: 1,
  ssl: config.database.ssl,
  ...schemaConnectionConfig,
});

// Client for queries
export const queryClient = postgres(databaseConnection.url, {
  max: config.database.maxConnections,
  idle_timeout: config.database.idleTimeout,
  ssl: config.database.ssl,
  ...schemaConnectionConfig,
});

// Drizzle ORM instance
export const db = drizzle(queryClient);

// Migration function
export async function runMigrations() {
  try {
    console.log("Running migrations...");
    
    const migrationDb = drizzle(migrationClient);
    
    await migrate(migrationDb, {
      migrationsFolder: "./drizzle",
    });
    
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
