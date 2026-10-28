import { describe, expect, it } from "vitest";
import { productionConfigurationErrors } from "./production";
import path from "node:path";
const valid = () => ({ NODE_ENV: "production", DATABASE_URL: "postgresql://user:password@database.example/arcway?sslmode=verify-full", APP_ORIGIN: "https://arcway.example.com", VITE_CLERK_PUBLISHABLE_KEY: "pk_live_example", CLERK_PUBLISHABLE_KEY: "pk_live_example", CLERK_SECRET_KEY: "sk_live_example", CLERK_AUTHORIZED_PARTIES: "https://arcway.example.com", STORAGE_LOCAL_DIR: path.resolve(".data/uploads"), AI_EVALUATION_DIR: path.resolve(".data/evaluations"), AI_PROVIDER: "gemini", GEMINI_API_KEY: "test-placeholder" });
describe("production startup configuration", () => {
  it("allows development and validates a complete production configuration", () => {
    expect(productionConfigurationErrors({ NODE_ENV: "development" })).toEqual([]);
    expect(productionConfigurationErrors(valid())).toEqual([]);
  });
  it("fails closed on test auth, mismatched public keys, insecure origins and database TLS", () => {
    const errors = productionConfigurationErrors({ ...valid(), CLERK_SECRET_KEY: "sk_test_example", VITE_CLERK_PUBLISHABLE_KEY: "pk_test_other", APP_ORIGIN: "http://localhost:3001", DATABASE_URL: "postgresql://db/arcway", SCHEDULER_SECRET: "short" });
    expect(errors.length).toBeGreaterThanOrEqual(5);
    expect(errors.join(" ")).not.toContain("sk_test_example");
  });
  it("validates optional Gmail credentials and the exact deployed callback", () => {
    expect(productionConfigurationErrors({ ...valid(), GMAIL_CLIENT_ID: "placeholder" }).some(error => error.includes("GMAIL_CLIENT_SECRET"))).toBe(true);
    expect(productionConfigurationErrors({ ...valid(), GMAIL_CLIENT_ID: "placeholder", GMAIL_CLIENT_SECRET: "placeholder", GMAIL_REDIRECT_URI: "https://arcway.example.com/api/integrations/gmail/callback", INTEGRATION_ENCRYPTION_KEY: "a".repeat(64), INTEGRATION_TOKEN_DIR: path.resolve(".data/integrations") })).toEqual([]);
  });
});
