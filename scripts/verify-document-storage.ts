import "dotenv/config";
import { readFile } from "node:fs/promises";
import { storagePut, storageRead, storageDelete } from "../server/storage";
import { extractDocumentFields } from "../server/services/documentIntelligence";
const buffer = await readFile("docs/samples/coffee-invoice.txt");
const stored = await storagePut("verification/invoice.txt", buffer, "text/plain");
try {
  const read = await storageRead(stored.key);
  if (!read.buffer.equals(buffer)) throw new Error("Stored bytes differ");
  const fields = await extractDocumentFields({ buffer: read.buffer, mimeType: read.contentType, documentType: "commercial invoice" });
  if (fields.invoiceNumber !== "ARCWAY-DEMO-001" || Number(fields.totalAmount.replace(/,/g, "")) !== 4250 || Number(fields.quantity.replace(/,/g, "")) !== 1000) throw new Error("Live extraction failed the synthetic invoice assertions");
  console.log(JSON.stringify({ storageRoundtrip: "passed", liveAiExtraction: "passed", invoiceNumber: fields.invoiceNumber, quantity: fields.quantity, totalAmount: fields.totalAmount, confidence: fields.confidence, issues: fields.issues }));
} finally { await storageDelete(stored.key); }
