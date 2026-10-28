export const ENV = {
  appId: process.env.VITE_APP_ID || "arcway",
  cookieSecret:
    process.env.JWT_SECRET || "arcway-jwt-secret-key-32-chars-minimum-pad",
  databaseUrl: process.env.DATABASE_URL ?? "",
  clerkPublishableKey:
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkEnabled: Boolean(
    process.env.CLERK_SECRET_KEY ||
      process.env.CLERK_PUBLISHABLE_KEY ||
      process.env.VITE_CLERK_PUBLISHABLE_KEY
  ),
  clerkAuthorizedParties: (
    process.env.CLERK_AUTHORIZED_PARTIES ||
    "http://localhost:3001,http://127.0.0.1:3001"
  )
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  aiProvider: process.env.AI_PROVIDER || "gemini",
  aiFallbackProvider: process.env.AI_FALLBACK_PROVIDER ?? "groq",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  groqModel: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
