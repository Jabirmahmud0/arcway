import { sql } from "drizzle-orm";
import {
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["trader", "reviewer"]).default("trader").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const memberships = mysqlTable("memberships", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["trader", "reviewer"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("membership_unique").on(table.organizationId, table.userId)]);

export const trades = mysqlTable(
  "trades",
  {
    id: int("id").autoincrement().primaryKey(),
    reference: varchar("reference", { length: 32 }).notNull().unique(),
    organizationId: int("organizationId").references(() => organizations.id),
    ownerId: int("ownerId").notNull().references(() => users.id),
    buyerName: varchar("buyerName", { length: 180 }).notNull(),
    buyerCountry: varchar("buyerCountry", { length: 2 }).notNull(),
    sellerName: varchar("sellerName", { length: 180 }).notNull(),
    sellerCountry: varchar("sellerCountry", { length: 2 }).notNull(),
    commodity: varchar("commodity", { length: 240 }).notNull(),
    quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 18, scale: 2 }).notNull(),
    totalValue: decimal("totalValue", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    incoterm: varchar("incoterm", { length: 8 }).notNull(),
    originCountry: varchar("originCountry", { length: 2 }).notNull(),
    destinationCountry: varchar("destinationCountry", { length: 2 }).notNull(),
    expectedShipmentDate: timestamp("expectedShipmentDate").notNull(),
    commercialState: mysqlEnum("commercialState", ["draft", "confirmed"]).notNull().default("draft"),
    executionState: mysqlEnum("executionState", ["not_started", "ready", "blocked"]).notNull().default("not_started"),
    documentState: mysqlEnum("documentState", ["pending", "in_progress", "complete"]).notNull().default("pending"),
    logisticsState: mysqlEnum("logisticsState", ["planned", "booked", "in_transit", "delivered"]).notNull().default("planned"),
    settlementState: mysqlEnum("settlementState", ["unconfirmed", "partial", "confirmed"]).notNull().default("unconfirmed"),
    assuranceState: mysqlEnum("assuranceState", ["draft", "submitted", "under_review", "approved", "rejected"]).notNull().default("draft"),
    partyKycState: mysqlEnum("partyKycState", ["unknown", "pending", "verified", "failed"]).notNull().default("pending"),
    trustScore: int("trustScore").notNull().default(0),
    trustBand: mysqlEnum("trustBand", ["critical", "guarded", "review", "ready"]).notNull().default("critical"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    submittedAt: timestamp("submittedAt"),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [index("trades_owner_idx").on(table.ownerId), index("trades_assurance_idx").on(table.assuranceState)]
);

export const tradeDocuments = mysqlTable(
  "tradeDocuments",
  {
    id: int("id").autoincrement().primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    documentType: mysqlEnum("documentType", [
      "commercial invoice",
      "packing list",
      "bill of lading",
      "certificate of origin",
      "inspection certificate",
      "LC/payment terms",
    ]).notNull(),
    status: mysqlEnum("status", ["pending", "uploaded", "under review", "verified", "rejected"]).notNull().default("pending"),
    fileName: varchar("fileName", { length: 255 }),
    fileKey: varchar("fileKey", { length: 512 }),
    fileUrl: varchar("fileUrl", { length: 1024 }),
    mimeType: varchar("mimeType", { length: 120 }),
    extractedData: json("extractedData"),
    inconsistencies: json("inconsistencies"),
    reviewerNotes: text("reviewerNotes"),
    uploadedBy: int("uploadedBy").references(() => users.id),
    reviewedBy: int("reviewedBy").references(() => users.id),
    uploadedAt: timestamp("uploadedAt"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("trade_document_type_idx").on(table.tradeId, table.documentType),
    index("trade_documents_status_idx").on(table.status),
  ]
);

export const tradeDocumentVersions = mysqlTable(
  "tradeDocumentVersions",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull().references(() => tradeDocuments.id),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    version: int("version").notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileKey: varchar("fileKey", { length: 512 }).notNull(),
    fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    extractedData: json("extractedData"),
    inconsistencies: json("inconsistencies"),
    source: varchar("source", { length: 80 }).notNull().default("user_upload"),
    supersededBy: int("supersededBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("document_version_idx").on(table.documentId, table.version),
    index("document_versions_trade_idx").on(table.tradeId),
  ]
);

export const tradeMessages = mysqlTable(
  "tradeMessages",
  {
    id: int("id").autoincrement().primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    sender: varchar("sender", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    body: text("body").notNull(),
    source: varchar("source", { length: 80 }).notNull().default("email"),
    receivedAt: timestamp("receivedAt").notNull(),
    ingestedBy: int("ingestedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("trade_messages_trade_idx").on(table.tradeId)]
);

export const tradeObligations = mysqlTable(
  "tradeObligations",
  {
    id: int("id").autoincrement().primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    actor: varchar("actor", { length: 180 }).notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    evidenceRequirement: varchar("evidenceRequirement", { length: 255 }),
    deadline: timestamp("deadline"),
    criticality: mysqlEnum("criticality", ["critical", "warning", "information"]).notNull().default("information"),
    status: mysqlEnum("status", ["open", "fulfilled", "overdue"]).notNull().default("open"),
    source: varchar("source", { length: 180 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("trade_obligations_trade_idx").on(table.tradeId)]
);

export const obligationTemplates = mysqlTable("obligationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  name: varchar("name", { length: 180 }).notNull(),
  actor: varchar("actor", { length: 180 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  evidenceRequirement: varchar("evidenceRequirement", { length: 255 }),
  criticality: mysqlEnum("criticality", ["critical", "warning", "information"]).notNull().default("information"),
  dueOffsetHours: int("dueOffsetHours"),
  releaseCondition: json("releaseCondition"),
  active: int("active").notNull().default(1),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("obligation_templates_org_idx").on(table.organizationId), index("obligation_templates_active_idx").on(table.active)]);

export const obligationDependencies = mysqlTable("obligationDependencies", {
  id: int("id").autoincrement().primaryKey(),
  obligationId: int("obligationId").notNull().references(() => tradeObligations.id),
  dependsOnObligationId: int("dependsOnObligationId").notNull().references(() => tradeObligations.id),
  dependencyType: mysqlEnum("dependencyType", ["blocks_release", "blocks_task", "evidence_prerequisite"]).notNull().default("blocks_release"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("obligation_dependency_unique_idx").on(table.obligationId, table.dependsOnObligationId), index("obligation_dependencies_obligation_idx").on(table.obligationId)]);

export const obligationEscalations = mysqlTable("obligationEscalations", {
  id: int("id").autoincrement().primaryKey(),
  obligationId: int("obligationId").notNull().references(() => tradeObligations.id),
  level: int("level").notNull().default(1),
  reason: text("reason").notNull(),
  escalatedAt: timestamp("escalatedAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  escalatedBy: int("escalatedBy").references(() => users.id),
}, table => [index("obligation_escalations_obligation_idx").on(table.obligationId)]);

export const tradeExceptions = mysqlTable(
  "tradeExceptions",
  {
    id: int("id").autoincrement().primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    documentId: int("documentId").references(() => tradeDocuments.id),
    category: mysqlEnum("category", ["commercial", "documentation", "execution", "logistics", "settlement", "compliance"]).notNull(),
    severity: mysqlEnum("severity", ["critical", "warning", "information"]).notNull(),
    status: mysqlEnum("status", ["open", "resolved"]).notNull().default("open"),
    title: varchar("title", { length: 255 }).notNull(),
    detail: text("detail").notNull(),
    resolutionOutcome: mysqlEnum("resolutionOutcome", ["corrected", "accepted_with_waiver", "rejected_source", "duplicate", "not_actionable"]),
    resolutionRationale: text("resolutionRationale"),
    resolvedBy: int("resolvedBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [index("trade_exceptions_trade_idx").on(table.tradeId), index("trade_exceptions_status_idx").on(table.status)]
);

export const tradeEvents = mysqlTable(
  "tradeEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    actorId: int("actorId").references(() => users.id),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    detail: text("detail"),
    source: varchar("source", { length: 80 }).notNull().default("application"),
    beforeState: json("beforeState"),
    afterState: json("afterState"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("trade_events_trade_idx").on(table.tradeId), index("trade_events_created_idx").on(table.createdAt)]
);

export const partnerRequests = mysqlTable(
  "partnerRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    requestedBy: int("requestedBy").notNull().references(() => users.id),
    recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
    requestType: varchar("requestType", { length: 120 }).notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", ["sent", "viewed", "responded", "accepted", "completed", "overdue", "cancelled"]).notNull().default("sent"),
    scope: json("scope"),
    responseSummary: text("responseSummary"),
    responseEvidence: json("responseEvidence"),
    respondedAt: timestamp("respondedAt"),
    dueAt: timestamp("dueAt"),
    lastReminderAt: timestamp("lastReminderAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => [index("partner_requests_trade_idx").on(table.tradeId)]
);

export const counterparties = mysqlTable("counterparties", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  tradingNames: json("tradingNames"),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  taxId: varchar("taxId", { length: 120 }),
  addresses: json("addresses"),
  contacts: json("contacts"),
  bankDetails: json("bankDetails"),
  defaultTerms: json("defaultTerms"),
  documentPreferences: json("documentPreferences"),
  requiredCertificates: json("requiredCertificates"),
  status: mysqlEnum("status", ["active", "inactive", "needs_review"]).notNull().default("active"),
  version: int("version").notNull().default(1),
  supersedesCounterpartyId: int("supersedesCounterpartyId"),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validTo: timestamp("validTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("counterparties_org_idx").on(table.organizationId), index("counterparties_legal_idx").on(table.legalName), index("counterparties_version_idx").on(table.organizationId, table.legalName, table.version), foreignKey({ columns: [table.supersedesCounterpartyId], foreignColumns: [table.id], name: "cp_supersedes_fk" })]);

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  sku: varchar("sku", { length: 120 }).notNull(),
  buyerSku: varchar("buyerSku", { length: 120 }),
  description: text("description").notNull(),
  variants: json("variants"),
  countryOfOrigin: varchar("countryOfOrigin", { length: 2 }),
  hsClassification: varchar("hsClassification", { length: 32 }),
  dimensions: json("dimensions"),
  netWeight: decimal("netWeight", { precision: 14, scale: 3 }),
  grossWeight: decimal("grossWeight", { precision: 14, scale: 3 }),
  packing: json("packing"),
  leadTimeDays: int("leadTimeDays"),
  certifications: json("certifications"),
  complianceAttributes: json("complianceAttributes"),
  version: int("version").notNull().default(1),
  supersedesProductId: int("supersedesProductId"),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validTo: timestamp("validTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("product_org_sku_idx").on(table.organizationId, table.sku, table.version), foreignKey({ columns: [table.supersedesProductId], foreignColumns: [table.id], name: "product_supersedes_fk" })]);

export const tradeLines = mysqlTable("tradeLines", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  productId: int("productId").references(() => products.id),
  sequence: int("sequence").notNull(),
  sku: varchar("sku", { length: 120 }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 18, scale: 4 }),
  totalValue: decimal("totalValue", { precision: 18, scale: 2 }),
  source: varchar("source", { length: 80 }).notNull().default("canonical"),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validTo: timestamp("validTo"),
}, table => [index("trade_lines_trade_idx").on(table.tradeId)]);

export const tradeRevisions = mysqlTable("tradeRevisions", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  version: int("version").notNull(),
  reason: text("reason").notNull(),
  beforeState: json("beforeState"),
  afterState: json("afterState").notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  observedAt: timestamp("observedAt"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  recordedBy: int("recordedBy").references(() => users.id),
}, table => [uniqueIndex("trade_revision_idx").on(table.tradeId, table.version)]);

export const evidenceFields = mysqlTable("evidenceFields", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  documentId: int("documentId").references(() => tradeDocuments.id),
  fieldName: varchar("fieldName", { length: 120 }).notNull(),
  fieldValue: text("fieldValue").notNull(),
  authority: mysqlEnum("authority", ["canonical", "authoritative", "supporting", "conflicting"]).notNull().default("supporting"),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  sourceLocation: json("sourceLocation"),
  modelVersion: varchar("modelVersion", { length: 120 }),
  extractedAt: timestamp("extractedAt"),
  confirmedBy: int("confirmedBy").references(() => users.id),
  confirmedAt: timestamp("confirmedAt"),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validTo: timestamp("validTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("evidence_fields_trade_idx").on(table.tradeId), index("evidence_fields_document_idx").on(table.documentId)]);

export const canonicalResolutions = mysqlTable("canonicalResolutions", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull(),
  fieldName: varchar("fieldName", { length: 120 }).notNull(),
  selectedEvidenceFieldId: int("selectedEvidenceFieldId"),
  selectedValue: text("selectedValue").notNull(),
  conflictingEvidenceFieldIds: json("conflictingEvidenceFieldIds"),
  rationale: text("rationale").notNull(),
  policyContext: json("policyContext"),
  resolvedBy: int("resolvedBy").notNull(),
  resolvedAt: timestamp("resolvedAt").defaultNow().notNull(),
  previousResolutionId: int("previousResolutionId"),
  active: int("active").notNull().default(1),
}, table => [
  index("canonical_resolutions_trade_idx").on(table.tradeId),
  index("canonical_resolutions_field_idx").on(table.tradeId, table.fieldName),
  index("canonical_resolutions_active_idx").on(table.active),
  foreignKey({ columns: [table.tradeId], foreignColumns: [trades.id], name: "canres_trade_fk" }),
  foreignKey({ columns: [table.selectedEvidenceFieldId], foreignColumns: [evidenceFields.id], name: "canres_evidence_fk" }),
  foreignKey({ columns: [table.resolvedBy], foreignColumns: [users.id], name: "canres_resolver_fk" }),
]);

export const policyPacks = mysqlTable("policyPacks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  name: varchar("name", { length: 180 }).notNull(),
  scope: mysqlEnum("scope", ["company", "counterparty", "product", "route", "payment", "transport", "jurisdiction"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "retired"]).notNull().default("draft"),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("policy_packs_org_idx").on(table.organizationId)]);

export const policyVersions = mysqlTable("policyVersions", {
  id: int("id").autoincrement().primaryKey(),
  policyPackId: int("policyPackId").notNull().references(() => policyPacks.id),
  version: int("version").notNull(),
  rules: json("rules").notNull(),
  effectiveFrom: timestamp("effectiveFrom").notNull(),
  effectiveTo: timestamp("effectiveTo"),
  source: varchar("source", { length: 180 }),
  jurisdiction: varchar("jurisdiction", { length: 120 }),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("policy_version_idx").on(table.policyPackId, table.version)]);

export const policyObligationBindings = mysqlTable("policyObligationBindings", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  policyPackId: int("policyPackId").notNull(),
  obligationTemplateId: int("obligationTemplateId").notNull(),
  counterpartyId: int("counterpartyId"),
  productId: int("productId"),
  relationshipRole: mysqlEnum("relationshipRole", ["buyer", "supplier", "forwarder", "carrier", "bank", "inspector", "any"]).notNull().default("any"),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  effectiveFrom: timestamp("effectiveFrom").defaultNow().notNull(),
  effectiveTo: timestamp("effectiveTo"),
  source: varchar("source", { length: 180 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("policy_obligation_binding_org_idx").on(table.organizationId),
  index("policy_obligation_binding_policy_idx").on(table.policyPackId),
  index("policy_obligation_binding_counterparty_idx").on(table.counterpartyId),
  index("policy_obligation_binding_product_idx").on(table.productId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "pob_org_fk" }),
  foreignKey({ columns: [table.policyPackId], foreignColumns: [policyPacks.id], name: "pob_policy_fk" }),
  foreignKey({ columns: [table.obligationTemplateId], foreignColumns: [obligationTemplates.id], name: "pob_template_fk" }),
  foreignKey({ columns: [table.counterpartyId], foreignColumns: [counterparties.id], name: "pob_counterparty_fk" }),
  foreignKey({ columns: [table.productId], foreignColumns: [products.id], name: "pob_product_fk" }),
  foreignKey({ columns: [table.createdBy], foreignColumns: [users.id], name: "pob_creator_fk" }),
]);

export const preflightRuns = mysqlTable("preflightRuns", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  gate: varchar("gate", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["ready", "ready_with_warnings", "at_risk", "blocked", "insufficient_data"]).notNull(),
  checks: json("checks").notNull(),
  policySnapshot: json("policySnapshot"),
  evidenceSnapshot: json("evidenceSnapshot"),
  runBy: int("runBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("preflight_runs_trade_idx").on(table.tradeId), index("preflight_runs_gate_idx").on(table.gate)]);

export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").references(() => trades.id),
  exceptionId: int("exceptionId").references(() => tradeExceptions.id),
  type: varchar("type", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"]).notNull().default("pending"),
  requestedBy: int("requestedBy").notNull().references(() => users.id),
  approverId: int("approverId").references(() => users.id),
  reason: text("reason").notNull(),
  decisionReason: text("decisionReason"),
  evidence: json("evidence"),
  decidedAt: timestamp("decidedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("approvals_trade_idx").on(table.tradeId), index("approvals_status_idx").on(table.status)]);

export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  mode: mysqlEnum("mode", ["sea", "air", "road", "rail", "multimodal"]).notNull(),
  carrier: varchar("carrier", { length: 180 }),
  forwarder: varchar("forwarder", { length: 180 }),
  bookingReference: varchar("bookingReference", { length: 160 }),
  containerReferences: json("containerReferences"),
  origin: varchar("origin", { length: 180 }),
  destination: varchar("destination", { length: 180 }),
  etd: timestamp("etd"),
  eta: timestamp("eta"),
  vessel: varchar("vessel", { length: 180 }),
  voyage: varchar("voyage", { length: 120 }),
  cutoffs: json("cutoffs"),
  status: mysqlEnum("status", ["planned", "booked", "in_transit", "delivered", "cancelled"]).notNull().default("planned"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("shipments_org_idx").on(table.organizationId)]);

export const shipmentAllocations = mysqlTable("shipmentAllocations", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull().references(() => shipments.id),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  allocatedQuantity: decimal("allocatedQuantity", { precision: 18, scale: 3 }),
  allocatedValue: decimal("allocatedValue", { precision: 18, scale: 2 }),
}, table => [index("shipment_allocations_trade_idx").on(table.tradeId)]);

export const shipmentEvents = mysqlTable("shipmentEvents", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull().references(() => shipments.id),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  location: varchar("location", { length: 180 }),
  plannedAt: timestamp("plannedAt"),
  actualAt: timestamp("actualAt"),
  source: varchar("source", { length: 80 }).notNull().default("manual"),
  rawPayload: json("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("shipment_events_shipment_idx").on(table.shipmentId)]);

export const paymentTerms = mysqlTable("paymentTerms", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  method: mysqlEnum("method", ["open_account", "advance", "letter_of_credit", "documentary_collection", "other"]).notNull(),
  depositPercent: decimal("depositPercent", { precision: 5, scale: 2 }),
  presentationDays: int("presentationDays"),
  latestShipmentDate: timestamp("latestShipmentDate"),
  dueDate: timestamp("dueDate"),
  lcReference: varchar("lcReference", { length: 160 }),
  specialClauses: json("specialClauses"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("payment_terms_trade_idx").on(table.tradeId)]);

export const paymentRecords = mysqlTable("paymentRecords", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  paymentTermId: int("paymentTermId").references(() => paymentTerms.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: mysqlEnum("status", ["expected", "received", "overdue", "disputed"]).notNull().default("expected"),
  evidenceDocumentId: int("evidenceDocumentId").references(() => tradeDocuments.id),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, table => [index("payment_records_trade_idx").on(table.tradeId)]);

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  exceptionId: int("exceptionId").references(() => tradeExceptions.id),
  parentId: int("parentId"),
  authorId: int("authorId").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  editedAt: timestamp("editedAt"),
}, table => [index("comments_trade_idx").on(table.tradeId)]);

export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  providerType: mysqlEnum("providerType", ["email", "storage", "erp", "carrier", "visibility", "ebl", "compliance", "payment", "finance", "identity"]).notNull(),
  providerName: varchar("providerName", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["disconnected", "connected", "degraded", "paused"]).notNull().default("disconnected"),
  configuration: json("configuration"),
  healthMessage: text("healthMessage"),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("integrations_org_idx").on(table.organizationId), index("integrations_provider_idx").on(table.providerType)]);

export const integrationRuns = mysqlTable("integrationRuns", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull().references(() => integrations.id),
  runType: varchar("runType", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["queued", "running", "completed", "failed", "skipped"]).notNull().default("queued"),
  inputSummary: json("inputSummary"),
  outputSummary: json("outputSummary"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("integration_runs_integration_idx").on(table.integrationId), index("integration_runs_status_idx").on(table.status)]);

export const integrationRunAttempts = mysqlTable("integrationRunAttempts", {
  id: int("id").autoincrement().primaryKey(),
  integrationRunId: int("integrationRunId").notNull().references(() => integrationRuns.id),
  attempt: int("attempt").notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed", "skipped"]).notNull(),
  errorMessage: text("errorMessage"),
  detail: json("detail"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, table => [uniqueIndex("integration_attempt_unique_idx").on(table.integrationRunId, table.attempt), index("integration_attempt_run_idx").on(table.integrationRunId)]);

export const sourceIngestionReceipts = mysqlTable("sourceIngestionReceipts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").references(() => trades.id),
  integrationId: int("integrationId").references(() => integrations.id),
  sourceType: mysqlEnum("sourceType", ["email_attachment", "structured_file", "webhook"]).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  mimeType: varchar("mimeType", { length: 120 }),
  payloadHash: varchar("payloadHash", { length: 128 }),
  rawPayload: json("rawPayload"),
  normalizedStatus: mysqlEnum("normalizedStatus", ["queued", "normalized", "failed", "replayed"]).notNull().default("queued"),
  routingStatus: mysqlEnum("routingStatus", ["pending", "routed", "dismissed"]).notNull().default("routed"),
  routingContext: json("routingContext"),
  routedAt: timestamp("routedAt"),
  routedBy: int("routedBy").references(() => users.id),
  errorMessage: text("errorMessage"),
  replayCount: int("replayCount").notNull().default(0),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  normalizedAt: timestamp("normalizedAt"),
  createdBy: int("createdBy").references(() => users.id),
}, table => [index("source_receipts_org_idx").on(table.organizationId), index("source_receipts_trade_idx").on(table.tradeId), index("source_receipts_status_idx").on(table.normalizedStatus), index("source_receipts_routing_idx").on(table.routingStatus), index("source_receipts_hash_idx").on(table.payloadHash)]);

export const workflowAlerts = mysqlTable("workflowAlerts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  integrationId: int("integrationId").references(() => integrations.id),
  integrationRunId: int("integrationRunId").references(() => integrationRuns.id),
  severity: mysqlEnum("severity", ["critical", "warning", "information"]).notNull().default("warning"),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).notNull().default("open"),
  title: varchar("title", { length: 255 }).notNull(),
  detail: text("detail").notNull(),
  dedupeKey: varchar("dedupeKey", { length: 180 }),
  occurrenceCount: int("occurrenceCount").notNull().default(1),
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedBy: int("acknowledgedBy").references(() => users.id),
  resolvedAt: timestamp("resolvedAt"),
}, table => [index("workflow_alert_org_idx").on(table.organizationId), index("workflow_alert_status_idx").on(table.status), uniqueIndex("workflow_alert_dedupe_idx").on(table.organizationId, table.dedupeKey)]);

export const workflowAlertPolicies = mysqlTable("workflowAlertPolicies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  alertType: mysqlEnum("alertType", ["source_failure", "source_health", "obligation_sla"]).notNull(),
  enabled: int("enabled").notNull().default(1),
  severity: mysqlEnum("severity", ["critical", "warning", "information"]).notNull().default("warning"),
  threshold: int("threshold").notNull().default(1),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("alert_policy_org_type_idx").on(table.organizationId, table.alertType), index("alert_policy_org_idx").on(table.organizationId), foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "alpol_org_fk" }), foreignKey({ columns: [table.updatedBy], foreignColumns: [users.id], name: "alpol_user_fk" })]);

export const operationalSchedules = mysqlTable("operationalSchedules", {
  id: int("id").autoincrement().primaryKey(),
  scheduleKey: varchar("scheduleKey", { length: 80 }).notNull().unique(),
  taskUid: varchar("taskUid", { length: 65 }).unique(),
  cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
  enabled: int("enabled").notNull().default(1),
  lastExecutedAt: timestamp("lastExecutedAt"),
  lastResult: json("lastResult"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("operational_schedules_task_uid_idx").on(table.taskUid)]);

export const externalReferences = mysqlTable("externalReferences", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").references(() => trades.id),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  providerName: varchar("providerName", { length: 180 }).notNull(),
  externalId: varchar("externalId", { length: 255 }).notNull(),
  payload: json("payload"),
  observedAt: timestamp("observedAt").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, table => [uniqueIndex("external_reference_unique_idx").on(table.organizationId, table.providerName, table.entityType, table.externalId), index("external_reference_trade_idx").on(table.tradeId)]);

export const importMappings = mysqlTable("importMappings", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  sourceName: varchar("sourceName", { length: 180 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  mapping: json("mapping").notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("import_mappings_org_idx").on(table.organizationId)]);

export const organizationControls = mysqlTable("organizationControls", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id).unique(),
  dataRetentionDays: int("dataRetentionDays").notNull().default(2555),
  allowedAiProviders: json("allowedAiProviders"),
  regionalProcessing: varchar("regionalProcessing", { length: 80 }).default("default"),
  piiRedaction: mysqlEnum("piiRedaction", ["off", "on_upload", "on_model_request"]).notNull().default("on_model_request"),
  publicModelTraining: mysqlEnum("publicModelTraining", ["disallowed", "allowed"]).notNull().default("disallowed"),
  requireMfa: mysqlEnum("requireMfa", ["disabled", "required"]).notNull().default("disabled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const capabilityGrants = mysqlTable("capabilityGrants", {
  id: int("id").autoincrement().primaryKey(),
  membershipId: int("membershipId").notNull().references(() => memberships.id),
  capability: varchar("capability", { length: 120 }).notNull(),
  grantedBy: int("grantedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("capability_grant_unique_idx").on(table.membershipId, table.capability), index("capability_grant_membership_idx").on(table.membershipId)]);

export const guestAccessGrants = mysqlTable("guestAccessGrants", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  tokenHash: varchar("tokenHash", { length: 255 }).notNull().unique(),
  scope: json("scope").notNull(),
  status: mysqlEnum("status", ["active", "expired", "revoked", "completed"]).notNull().default("active"),
  expiresAt: timestamp("expiresAt").notNull(),
  accessedAt: timestamp("accessedAt"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("guest_access_trade_idx").on(table.tradeId), index("guest_access_org_idx").on(table.organizationId)]);

export const auditRecords = mysqlTable("auditRecords", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  actorId: int("actorId").references(() => users.id),
  action: varchar("action", { length: 160 }).notNull(),
  objectType: varchar("objectType", { length: 120 }).notNull(),
  objectId: varchar("objectId", { length: 160 }).notNull(),
  beforeState: json("beforeState"),
  afterState: json("afterState"),
  reason: text("reason"),
  source: varchar("source", { length: 120 }).notNull().default("application"),
  sourceIp: varchar("sourceIp", { length: 64 }),
  device: varchar("device", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("audit_records_org_idx").on(table.organizationId), index("audit_records_object_idx").on(table.objectType, table.objectId), index("audit_records_created_idx").on(table.createdAt)]);

export const tradeTasks = mysqlTable("tradeTasks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  exceptionId: int("exceptionId").references(() => tradeExceptions.id),
  obligationId: int("obligationId").references(() => tradeObligations.id),
  title: varchar("title", { length: 255 }).notNull(),
  detail: text("detail").notNull(),
  assigneeId: int("assigneeId").references(() => users.id),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "cancelled"]).notNull().default("open"),
  completedAt: timestamp("completedAt"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("trade_tasks_trade_idx").on(table.tradeId), index("trade_tasks_assignee_idx").on(table.assigneeId), index("trade_tasks_status_idx").on(table.status)]);

export const generatedDocuments = mysqlTable("generatedDocuments", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  documentType: varchar("documentType", { length: 120 }).notNull(),
  templateVersion: varchar("templateVersion", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["draft", "issued", "voided"]).notNull().default("draft"),
  dataSnapshot: json("dataSnapshot").notNull(),
  renderedContent: text("renderedContent").notNull(),
  contentHash: varchar("contentHash", { length: 128 }).notNull(),
  issuedBy: int("issuedBy").references(() => users.id),
  issuedAt: timestamp("issuedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("generated_documents_trade_idx").on(table.tradeId), index("generated_documents_status_idx").on(table.status)]);

export const preflightWaivers = mysqlTable("preflightWaivers", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  policyVersionId: int("policyVersionId").references(() => policyVersions.id),
  ruleKey: varchar("ruleKey", { length: 160 }).notNull(),
  reason: text("reason").notNull(),
  decision: mysqlEnum("decision", ["active", "expired", "revoked"]).notNull().default("active"),
  expiresAt: timestamp("expiresAt").notNull(),
  approvedBy: int("approvedBy").notNull().references(() => users.id),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("preflight_waivers_trade_idx").on(table.tradeId), index("preflight_waivers_policy_idx").on(table.policyVersionId), index("preflight_waivers_decision_idx").on(table.decision)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type TradeDocument = typeof tradeDocuments.$inferSelect;
