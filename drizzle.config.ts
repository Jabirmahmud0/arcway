import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/postgresql",
  dialect: "postgresql",
  ...(connectionString ? { dbCredentials: { url: connectionString } } : {}),
});
