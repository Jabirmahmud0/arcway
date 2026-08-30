export const REQUIRED_DOCUMENT_TYPES = [
  "commercial invoice",
  "packing list",
  "bill of lading",
  "certificate of origin",
  "inspection certificate",
  "LC/payment terms",
] as const;

export const DOCUMENT_STATUSES = ["pending", "uploaded", "under review", "verified", "rejected"] as const;

export type RequiredDocumentType = (typeof REQUIRED_DOCUMENT_TYPES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type ExtractedTradeFields = {
  invoiceNumber: string;
  issueDate: string;
  currency: string;
  totalAmount: string;
  unitPrice: string;
  sellerName: string;
  buyerName: string;
  quantity: string;
  unit: string;
  incoterm: string;
  originCountry: string;
  destinationCountry: string;
  transportReference: string;
  shipmentDate: string;
  confidence: number;
  issues: string[];
};

export type TrustScore = {
  score: number;
  band: "critical" | "guarded" | "review" | "ready";
  components: {
    evidence: number;
    partyKyc: number;
    consistency: number;
  };
};

export function calculateTrustScore(input: {
  documents: Array<{ status: DocumentStatus; inconsistencies: unknown }>;
  partyKycState: "unknown" | "pending" | "verified" | "failed";
}): TrustScore {
  const totalDocuments = REQUIRED_DOCUMENT_TYPES.length;
  const verifiedDocuments = input.documents.filter(document => document.status === "verified").length;
  const evidence = Math.round((verifiedDocuments / totalDocuments) * 50);
  const partyKyc = input.partyKycState === "verified" ? 20 : input.partyKycState === "pending" ? 10 : 0;
  const inconsistencyCount = input.documents.reduce((count, document) => {
    return count + (Array.isArray(document.inconsistencies) ? document.inconsistencies.length : 0);
  }, 0);
  const consistency = Math.max(0, 30 - inconsistencyCount * 6);
  const score = Math.max(0, Math.min(100, evidence + partyKyc + consistency));
  const band = score >= 85 ? "ready" : score >= 65 ? "review" : score >= 40 ? "guarded" : "critical";

  return { score, band, components: { evidence, partyKyc, consistency } };
}

export function normalizeForComparison(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}

export function findCrossDocumentInconsistencies(
  fields: ExtractedTradeFields,
  existing: ExtractedTradeFields[]
) {
  const comparedFields: Array<keyof Pick<ExtractedTradeFields, "sellerName" | "buyerName" | "currency" | "totalAmount" | "unitPrice" | "issueDate" | "shipmentDate" | "quantity" | "incoterm" | "originCountry" | "destinationCountry">> = [
    "sellerName",
    "buyerName",
    "currency",
    "totalAmount",
    "unitPrice",
    "issueDate",
    "shipmentDate",
    "quantity",
    "incoterm",
    "originCountry",
    "destinationCountry",
  ];

  return comparedFields.flatMap(field => {
    const value = normalizeForComparison(fields[field]);
    if (!value) return [];
    const conflicting = existing.find(candidate => {
      const candidateValue = normalizeForComparison(candidate[field]);
      return candidateValue && candidateValue !== value;
    });
    return conflicting ? [`${field} conflicts with another uploaded document.`] : [];
  });
}
