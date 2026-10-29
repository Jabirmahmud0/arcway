import { describe, expect, it } from "vitest";
import { configureVercelEnvironment } from "./vercelEnvironment";
import { productionConfigurationErrors } from "./production";

describe("Vercel environment configuration", () => {
  it("derives deployment-owned origins, removes local auth parties, and uses durable storage", () => {
    const env: NodeJS.ProcessEnv = { VERCEL: "1", VERCEL_URL: "arcway-preview.vercel.app", VERCEL_PROJECT_PRODUCTION_URL: "arcway-six.vercel.app", CLERK_AUTHORIZED_PARTIES: "http://localhost:3001", GMAIL_REDIRECT_URI: "http://localhost:3001/api/integrations/gmail/callback" };
    configureVercelEnvironment(env);
    expect(env.APP_ORIGIN).toBe("https://arcway-six.vercel.app");
    expect(env.CLERK_AUTHORIZED_PARTIES).toBe("https://arcway-six.vercel.app,https://arcway-preview.vercel.app");
    expect(env.GMAIL_REDIRECT_URI).toBe("https://arcway-six.vercel.app/api/integrations/gmail/callback");
    expect(env.RUNTIME_STATE_BACKEND).toBe("postgres");
    expect(env.OPERATIONAL_SCHEDULER_ENABLED).toBe("false");
  });
  it("keeps native-host settings unchanged", () => {
    const env = { APP_ORIGIN: "https://example.com" }; configureVercelEnvironment(env);
    expect(env).toEqual({ APP_ORIGIN: "https://example.com" });
  });
  it("accepts authenticated demo keys only when demo mode is explicit, without writable directories", () => {
    const env = { NODE_ENV: "production", VERCEL: "1", APP_ORIGIN: "https://arcway-six.vercel.app", CLERK_AUTHORIZED_PARTIES: "https://arcway-six.vercel.app", VITE_CLERK_PUBLISHABLE_KEY: "pk_test_fixture", CLERK_PUBLISHABLE_KEY: "pk_test_fixture", CLERK_SECRET_KEY: "sk_test_fixture", DATABASE_URL: "postgresql://fixture/db?sslmode=require", AI_PROVIDER: "gemini", GEMINI_API_KEY: "fixture", ARCWAY_DEPLOYMENT_MODE: "demo" };
    expect(productionConfigurationErrors(env)).toEqual([]);
    expect(productionConfigurationErrors({ ...env, ARCWAY_DEPLOYMENT_MODE: "production" }).some(error => error.includes("live keys"))).toBe(true);
  });
});
