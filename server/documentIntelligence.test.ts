import { beforeEach, describe, expect, it, vi } from "vitest";
const model = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: model.invoke }));
vi.mock("./_core/env", () => ({
  ENV: {
    aiProvider: "gemini",
    aiFallbackProvider: "groq",
    geminiApiKey: "test",
    groqApiKey: "test",
    geminiModel: "gemini-2.5-flash",
    groqModel: "qwen/qwen3.8-27b",
  },
}));
vi.mock("pdf-parse", () => ({ PDFParse: vi.fn() }));
import { extractDocumentFields } from "./services/documentIntelligence";
const fields = {
  invoiceNumber: "INV-1",
  issueDate: "",
  currency: "USD",
  totalAmount: "100",
  unitPrice: "",
  sellerName: "Seller",
  buyerName: "Buyer",
  quantity: "",
  unit: "",
  incoterm: "",
  originCountry: "",
  destinationCountry: "",
  transportReference: "",
  shipmentDate: "",
  confidence: 0.9,
  issues: [],
};
const response = (data: unknown) => ({
  choices: [{ message: { content: JSON.stringify(data) } }],
});
beforeEach(() => {
  model.invoke.mockReset();
});
describe("document AI extraction", () => {
  it("falls back to Groq when Gemini returns malformed structured data", async () => {
    model.invoke
      .mockResolvedValueOnce(response({ confidence: 4 }))
      .mockResolvedValueOnce(response(fields));
    const result = await extractDocumentFields({
      buffer: Buffer.from("Invoice INV-1, USD 100"),
      mimeType: "text/plain",
      documentType: "commercial invoice",
    });
    expect(result.invoiceNumber).toBe("INV-1");
    expect(
      model.invoke.mock.calls.map(([request]) => request.provider)
    ).toEqual(["gemini", "groq"]);
  });
  it("requires reviewer inspection rather than trusting invalid provider output", async () => {
    model.invoke.mockResolvedValue(response({ ...fields, confidence: 7 }));
    const result = await extractDocumentFields({
      buffer: Buffer.from("Invoice"),
      mimeType: "text/plain",
      documentType: "commercial invoice",
    });
    expect(result.confidence).toBe(0);
    expect(result.invoiceNumber).toBe("");
    expect(result.issues).toContain(
      "Automated extraction could not complete; reviewer inspection required."
    );
  });
  it("does not send an image to the text-only fallback", async () => {
    model.invoke.mockRejectedValue(new Error("Unavailable"));
    await extractDocumentFields({
      buffer: Buffer.from("image fixture"),
      mimeType: "image/png",
      documentType: "commercial invoice",
    });
    expect(model.invoke).toHaveBeenCalledTimes(1);
    expect(model.invoke.mock.calls[0][0].provider).toBe("gemini");
  });
  it("does not ask a model to invent data for an empty document", async () => {
    const result = await extractDocumentFields({
      buffer: Buffer.from("  "),
      mimeType: "text/plain",
      documentType: "commercial invoice",
    });
    expect(model.invoke).not.toHaveBeenCalled();
    expect(result.confidence).toBe(0);
  });
});
