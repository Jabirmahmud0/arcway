import type { InferSelectModel } from "drizzle-orm";
import type { tradeDocuments, tradeDocumentVersions } from "../drizzle/schema";

export const DOCUMENT_EVIDENCE_PIPELINE = "document-fields-v1";
export const DOCUMENT_FIELD_NAMES = [
  "invoiceNumber", "issueDate", "currency", "totalAmount", "unitPrice",
  "sellerName", "buyerName", "quantity", "unit", "incoterm",
  "originCountry", "destinationCountry", "transportReference", "shipmentDate",
] as const;

export function buildDocumentEvidence(
  document: InferSelectModel<typeof tradeDocuments>,
  version?: Pick<InferSelectModel<typeof tradeDocumentVersions>, "id" | "version"> & Partial<Pick<InferSelectModel<typeof tradeDocumentVersions>, "source" | "createdAt" | "supersededBy">>,
) {
  if (!document.fileKey || !document.extractedData) return [];
  const extracted = document.extractedData as Record<string, unknown>;
  const confidence = typeof extracted.confidence === "number" && Number.isFinite(extracted.confidence)
    && extracted.confidence >= 0 && extracted.confidence <= 1 ? extracted.confidence.toFixed(4) : null;
  const metadata = extracted.extractionMeta as Record<string, unknown> | undefined;
  return DOCUMENT_FIELD_NAMES.flatMap(fieldName => {
    const raw = extracted[fieldName];
    if (typeof raw !== "string" && !(typeof raw === "number" && Number.isFinite(raw))) return [];
    const fieldValue = String(raw).trim();
    if (!fieldValue) return [];
    return [{
      tradeId: document.tradeId,
      documentId: document.id,
      fieldName,
      fieldValue,
      authority: "supporting" as const,
      confidence,
      sourceLocation: {
        sourceType: "document_upload",
        documentId: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        fileKey: document.fileKey,
        mimeType: document.mimeType,
        documentVersionId: version?.id ?? null,
        documentVersion: version?.version ?? null,
        fieldName,
        extractionPipeline: DOCUMENT_EVIDENCE_PIPELINE,
        ...(version?.source === "reviewer_correction" ? { correctionSource: "reviewer_correction", reviewerId: version.supersededBy, correctedAt: version.createdAt?.toISOString() } : {}),
        ...(metadata ? { provider: metadata.provider, model: metadata.model, promptVersion: metadata.promptVersion, inputHash: metadata.inputHash } : {}),
      },
      // Pipeline identifier; the original extractor did not retain provider/model IDs.
      modelVersion: DOCUMENT_EVIDENCE_PIPELINE,
      extractedAt: version?.source === "reviewer_correction" ? version.createdAt ?? document.reviewedAt : document.uploadedAt,
    }];
  });
}
