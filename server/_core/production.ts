import path from "node:path";

export function productionConfigurationErrors(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== "production") return [];
  const errors: string[] = [];
  const requireValue = (name: string) => { if (!env[name]?.trim()) errors.push(`${name} is required`); };
  for (const name of ["DATABASE_URL", "APP_ORIGIN", "VITE_CLERK_PUBLISHABLE_KEY", "CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "CLERK_AUTHORIZED_PARTIES", "STORAGE_LOCAL_DIR", "AI_EVALUATION_DIR"]) requireValue(name);
  if (!env.CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_") || !env.CLERK_SECRET_KEY?.startsWith("sk_live_")) errors.push("Production requires Clerk live keys");
  if (env.VITE_CLERK_PUBLISHABLE_KEY !== env.CLERK_PUBLISHABLE_KEY) errors.push("Clerk browser and server publishable keys must match");
  try {
    const origin = new URL(env.APP_ORIGIN!);
    if (origin.protocol !== "https:" || origin.origin !== env.APP_ORIGIN || /^(localhost|127\.0\.0\.1)$/.test(origin.hostname)) errors.push("APP_ORIGIN must be an exact public HTTPS origin");
    const parties = (env.CLERK_AUTHORIZED_PARTIES ?? "").split(",").map(value => value.trim());
    if (!parties.includes(origin.origin) || parties.some(value => { try { return new URL(value).protocol !== "https:" || new URL(value).origin !== value; } catch { return true; } })) errors.push("Clerk authorized parties must contain APP_ORIGIN and use exact HTTPS origins");
  } catch { errors.push("APP_ORIGIN must be a valid HTTPS origin"); }
  try {
    const database = new URL(env.DATABASE_URL!);
    if (!["postgres:", "postgresql:"].includes(database.protocol) || !["require", "verify-full", "verify-ca"].includes(database.searchParams.get("sslmode") ?? "")) errors.push("DATABASE_URL must use PostgreSQL with TLS");
  } catch { errors.push("DATABASE_URL must be a valid PostgreSQL URL"); }
  for (const name of ["STORAGE_LOCAL_DIR", "AI_EVALUATION_DIR"]) if (env[name] && !path.isAbsolute(env[name]!)) errors.push(`${name} must be an absolute persistent path`);
  const provider = env.AI_PROVIDER || "gemini";
  if (!["gemini", "groq"].includes(provider)) errors.push("AI_PROVIDER must be gemini or groq");
  else requireValue(`${provider.toUpperCase()}_API_KEY`);
  if (env.GMAIL_CLIENT_ID || env.GMAIL_CLIENT_SECRET) {
    for (const name of ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REDIRECT_URI", "INTEGRATION_TOKEN_DIR"]) requireValue(name);
    if (!/^[a-fA-F0-9]{64}$/.test(env.INTEGRATION_ENCRYPTION_KEY ?? "")) errors.push("INTEGRATION_ENCRYPTION_KEY must contain 64 hexadecimal characters");
    if (!path.isAbsolute(env.INTEGRATION_TOKEN_DIR ?? "")) errors.push("INTEGRATION_TOKEN_DIR must be an absolute persistent path");
    if (env.GMAIL_REDIRECT_URI !== `${env.APP_ORIGIN}/api/integrations/gmail/callback`) errors.push("Gmail callback must match APP_ORIGIN");
  }
  if (env.SCHEDULER_SECRET && env.SCHEDULER_SECRET.length < 32) errors.push("SCHEDULER_SECRET must have at least 32 characters");
  return errors;
}
