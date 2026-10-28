import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const config = vi.hoisted(() => ({
  aiProvider: "gemini",
  aiFallbackProvider: "groq",
  geminiApiKey: "test-gemini-key",
  groqApiKey: "test-groq-key",
  geminiModel: "gemini-2.5-flash",
  groqModel: "qwen/qwen3.8-27b",
}));
vi.mock("./_core/env", () => ({ ENV: config }));
import { getDocumentProviders } from "./_core/aiProviders";
import { invokeLLM, listLLMModels } from "./_core/llm";
const schema = {
  type: "json_schema" as const,
  json_schema: {
    name: "test",
    strict: true,
    schema: {
      type: "object",
      properties: { ok: { type: "boolean" } },
      required: ["ok"],
      additionalProperties: false,
    },
  },
};
const completion = () =>
  Response.json({
    model: "test",
    choices: [{ message: { role: "assistant", content: '{"ok":true}' } }],
  });
beforeEach(() => {
  config.aiProvider = "gemini";
  config.aiFallbackProvider = "groq";
  config.geminiApiKey = "test-gemini-key";
  config.groqApiKey = "test-groq-key";
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Gemini and Groq provider adapters", () => {
  it("routes Gemini to Google with structured output and its own server-side credential", async () => {
    const fetcher = vi.fn().mockResolvedValue(completion());
    vi.stubGlobal("fetch", fetcher);
    await invokeLLM({
      messages: [{ role: "user", content: "Test" }],
      response_format: schema,
    });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    );
    expect(init.headers.authorization).toBe("Bearer test-gemini-key");
    expect(JSON.parse(init.body)).toMatchObject({
      model: "gemini-2.5-flash",
      response_format: schema,
      reasoning_effort: "none",
    });
  });
  it("routes Groq to its own endpoint and uses JSON mode with a schema instruction", async () => {
    const fetcher = vi.fn().mockResolvedValue(completion());
    vi.stubGlobal("fetch", fetcher);
    await invokeLLM({
      provider: "groq",
      messages: [{ role: "user", content: "Test" }],
      response_format: schema,
    });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.authorization).toBe("Bearer test-groq-key");
    const payload = JSON.parse(init.body);
    expect(payload).toMatchObject({
      model: "qwen/qwen3.8-27b",
      response_format: { type: "json_object" },
    });
    expect(payload.messages[0].content).toContain(
      JSON.stringify(schema.json_schema.schema)
    );
  });
  it("does not retry rejected credentials or echo the upstream response body", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response("sensitive upstream diagnostic", { status: 401 })
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(invokeLLM({ messages: [] })).rejects.toThrow(
      "gemini AI request failed (HTTP 401)."
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("refuses image requests to the configured text-only Groq model before transmission", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      invokeLLM({
        provider: "groq",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: "data:image/png;base64,test" },
              },
            ],
          },
        ],
      })
    ).rejects.toThrow("text only");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("limits image extraction to Gemini and excludes missing credentials", () => {
    expect(getDocumentProviders(false)).toEqual(["gemini", "groq"]);
    expect(getDocumentProviders(true)).toEqual(["gemini"]);
    config.geminiApiKey = "";
    expect(getDocumentProviders(true)).toEqual([]);
    expect(getDocumentProviders(false)).toEqual(["groq"]);
  });
  it("normalizes Google model IDs without selecting an arbitrary first model", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            object: "list",
            data: [{ id: "models/gemini-2.5-flash" }],
          })
        )
    );
    expect((await listLLMModels("gemini")).data[0].id).toBe("gemini-2.5-flash");
  });
});
