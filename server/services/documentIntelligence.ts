import { PDFParse } from "pdf-parse";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { type ExtractedTradeFields, type RequiredDocumentType } from "../tradeDomain";

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    invoiceNumber: { type: "string" },
    issueDate: { type: "string" },
    currency: { type: "string" },
    totalAmount: { type: "string" },
    unitPrice: { type: "string" },
    sellerName: { type: "string" },
    buyerName: { type: "string" },
    quantity: { type: "string" },
    unit: { type: "string" },
    incoterm: { type: "string" },
    originCountry: { type: "string" },
    destinationCountry: { type: "string" },
    transportReference: { type: "string" },
    shipmentDate: { type: "string" },
    confidence: { type: "number" },
    issues: { type: "array", items: { type: "string" } },
  },
  required: [
    "invoiceNumber", "issueDate", "currency", "totalAmount", "unitPrice", "sellerName", "buyerName", "quantity", "unit",
    "incoterm", "originCountry", "destinationCountry", "transportReference", "shipmentDate", "confidence", "issues",
  ],
  additionalProperties: false,
} as const;

const emptyExtraction = (): ExtractedTradeFields => ({
  invoiceNumber: "", issueDate: "", currency: "", totalAmount: "", unitPrice: "", sellerName: "", buyerName: "", quantity: "",
  unit: "", incoterm: "", originCountry: "", destinationCountry: "", transportReference: "", shipmentDate: "", confidence: 0, issues: [],
});

async function extractTextFromPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.slice(0, 24_000);
  } finally {
    await parser.destroy();
  }
}

function decodeText(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return extractTextFromPdf(buffer);
  if (mimeType === "text/plain" || mimeType === "text/csv") return Promise.resolve(buffer.toString("utf8").slice(0, 24_000));
  return Promise.resolve("");
}

export async function extractDocumentFields(input: {
  buffer: Buffer;
  mimeType: string;
  documentType: RequiredDocumentType;
}) {
  const text = await decodeText(input.buffer, input.mimeType);
  const models = await listLLMModels();
  const model = models.data.find(item => item.id === "gpt-5-mini")?.id ?? models.data[0]?.id;
  if (!model) return emptyExtraction();

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "auto" } }
  > = [
    { type: "text" as const, text: `Extract canonical trade fields from this ${input.documentType}. Use empty strings when a value is not present. Do not infer missing facts.\n\nDocument text:\n${text || "[No machine-readable text was found. Extract only what can be observed from the attached file, otherwise leave fields empty.]"}` },
  ];
  if (input.mimeType === "image/jpeg" || input.mimeType === "image/png") {
    content.push({ type: "image_url" as const, image_url: { url: `data:${input.mimeType};base64,${input.buffer.toString("base64")}`, detail: "auto" } });
  }

  try {
    const response = await invokeLLM({
      model,
      maxTokens: 1200,
      messages: [
        { role: "system", content: "You extract factual fields from international trade documents. Return only the requested structured data. Never invent values." },
        { role: "user", content },
      ],
      response_format: { type: "json_schema", json_schema: { name: "trade_document_fields", strict: true, schema: EXTRACTION_SCHEMA } },
    });
    const raw = response.choices[0]?.message.content;
    const contentText = typeof raw === "string" ? raw : "";
    return { ...emptyExtraction(), ...JSON.parse(contentText) } as ExtractedTradeFields;
  } catch (error) {
    console.warn("[Document intelligence] Structured extraction unavailable", error);
    return { ...emptyExtraction(), issues: ["Automated extraction could not complete; reviewer inspection required."] };
  }
}
