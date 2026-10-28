import { ENV } from "./env";

export type AIProvider = "gemini" | "groq";

export function getAIProviderConfig(provider: string = ENV.aiProvider) {
  if (provider === "gemini")
    return {
      provider: "gemini" as const,
      apiKey: ENV.geminiApiKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: ENV.geminiModel,
      supportsImages: true,
    };
  if (provider === "groq")
    return {
      provider: "groq" as const,
      apiKey: ENV.groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      model: ENV.groqModel,
      supportsImages: false,
    };
  throw new Error("AI_PROVIDER must be gemini or groq.");
}

export function getDocumentProviders(needsImages: boolean): AIProvider[] {
  const providers = Array.from(
    new Set([ENV.aiProvider, ENV.aiFallbackProvider].filter(Boolean))
  );
  return providers
    .map(provider => getAIProviderConfig(provider))
    .filter(config => config.apiKey && (!needsImages || config.supportsImages))
    .map(config => config.provider);
}
