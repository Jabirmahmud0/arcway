import { sql } from "drizzle-orm";
import {
  numeric as decimal,
  foreignKey,
  index,
  integer as int,
  serial,
  jsonb as json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";


export const usersRoleEnum = pgEnum("users_role_enum", ["trader", "reviewer"]);
export const appRuntimeState = pgTable("appRuntimeState", {
  id: serial("id").primaryKey(),
  namespace: varchar("namespace", { length: 64 }).notNull(),
  key: varchar("key", { length: 512 }).notNull(),
  value: json("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [uniqueIndex("runtime_state_key_idx").on(table.namespace, table.key), index("runtime_state_expiry_idx").on(table.expiresAt)]);
export const membershipsRoleEnum = pgEnum("memberships_role_enum", ["trader", "reviewer"]);
export const tradesCommercialStateEnum = pgEnum("trades_commercial_state_enum", ["draft", "confirmed"]);
export const tradesExecutionStateEnum = pgEnum("trades_execution_state_enum", ["not_started", "ready", "blocked"]);
export const tradesDocumentStateEnum = pgEnum("trades_document_state_enum", ["pending", "in_progress", "complete"]);
export const tradesLogisticsStateEnum = pgEnum("trades_logistics_state_enum", ["planned", "booked", "in_transit", "delivered"]);
export const tradesSettlementStateEnum = pgEnum("trades_settlement_state_enum", ["unconfirmed", "partial", "confirmed"]);
export const tradesAssuranceStateEnum = pgEnum("trades_assurance_state_enum", ["draft", "submitted", "under_review", "approved", "rejected"]);
export const tradesPartyKycStateEnum = pgEnum("trades_party_kyc_state_enum", ["unknown", "pending", "verified", "failed"]);
export const tradesTrustBandEnum = pgEnum("trades_trust_band_enum", ["critical", "guarded", "review", "ready"]);
export const tradeDocumentsDocumentTypeEnum = pgEnum("trade_documents_document_type_enum", [
      "commercial invoice",
      "packing list",
      "bill of lading",
      "certificate of origin",
      "inspection certificate",
      "LC/payment terms",
    ]);
export const tradeDocumentsStatusEnum = pgEnum("trade_documents_status_enum", ["pending", "uploaded", "under review", "verified", "rejected"]);
export const tradeObligationsCriticalityEnum = pgEnum("trade_obligations_criticality_enum", ["critical", "warning", "information"]);
export const tradeObligationsStatusEnum = pgEnum("trade_obligations_status_enum", ["open", "fulfilled", "overdue"]);
export const obligationTemplatesCriticalityEnum = pgEnum("obligation_templates_criticality_enum", ["critical", "warning", "information"]);
export const obligationDependenciesDependencyTypeEnum = pgEnum("obligation_dependencies_dependency_type_enum", ["blocks_release", "blocks_task", "evidence_prerequisite"]);
export const tradeExceptionsCategoryEnum = pgEnum("trade_exceptions_category_enum", ["commercial", "documentation", "execution", "logistics", "settlement", "compliance"]);
export const tradeExceptionsSeverityEnum = pgEnum("trade_exceptions_severity_enum", ["critical", "warning", "information"]);
export const tradeExceptionsStatusEnum = pgEnum("trade_exceptions_status_enum", ["open", "resolved"]);
export const tradeExceptionsResolutionOutcomeEnum = pgEnum("trade_exceptions_resolution_outcome_enum", ["corrected", "accepted_with_waiver", "rejected_source", "duplicate", "not_actionable"]);
export const partnerRequestsStatusEnum = pgEnum("partner_requests_status_enum", ["sent", "viewed", "responded", "accepted", "completed", "overdue", "cancelled"]);
export const counterpartiesStatusEnum = pgEnum("counterparties_status_enum", ["active", "inactive", "needs_review"]);
export const evidenceFieldsAuthorityEnum = pgEnum("evidence_fields_authority_enum", ["canonical", "authoritative", "supporting", "conflicting"]);
export const policyPacksScopeEnum = pgEnum("policy_packs_scope_enum", ["company", "counterparty", "product", "route", "payment", "transport", "jurisdiction"]);
export const policyPacksStatusEnum = pgEnum("policy_packs_status_enum", ["draft", "active", "retired"]);
export const policyObligationBindingsRelationshipRoleEnum = pgEnum("policy_obligation_bindings_relationship_role_enum", ["buyer", "supplier", "forwarder", "carrier", "bank", "inspector", "any"]);
export const policyObligationBindingsStatusEnum = pgEnum("policy_obligation_bindings_status_enum", ["active", "inactive"]);
export const preflightRunsStatusEnum = pgEnum("preflight_runs_status_enum", ["ready", "ready_with_warnings", "at_risk", "blocked", "insufficient_data"]);
export const approvalsStatusEnum = pgEnum("approvals_status_enum", ["pending", "approved", "rejected", "expired"]);
export const shipmentsModeEnum = pgEnum("shipments_mode_enum", ["sea", "air", "road", "rail", "multimodal"]);
export const shipmentsStatusEnum = pgEnum("shipments_status_enum", ["planned", "booked", "in_transit", "delivered", "cancelled"]);
export const paymentTermsMethodEnum = pgEnum("payment_terms_method_enum", ["open_account", "advance", "letter_of_credit", "documentary_collection", "other"]);
export const paymentRecordsStatusEnum = pgEnum("payment_records_status_enum", ["expected", "received", "overdue", "disputed"]);
export const integrationsProviderTypeEnum = pgEnum("integrations_provider_type_enum", ["email", "storage", "erp", "carrier", "visibility", "ebl", "compliance", "payment", "finance", "identity"]);
export const integrationsStatusEnum = pgEnum("integrations_status_enum", ["disconnected", "connected", "degraded", "paused"]);
export const integrationRunsStatusEnum = pgEnum("integration_runs_status_enum", ["queued", "running", "completed", "failed", "skipped"]);
export const integrationRunAttemptsStatusEnum = pgEnum("integration_run_attempts_status_enum", ["running", "completed", "failed", "skipped"]);
export const sourceIngestionReceiptsSourceTypeEnum = pgEnum("source_ingestion_receipts_source_type_enum", ["email_attachment", "structured_file", "webhook"]);
export const sourceIngestionReceiptsNormalizedStatusEnum = pgEnum("source_ingestion_receipts_normalized_status_enum", ["queued", "normalized", "failed", "replayed"]);
export const sourceIngestionReceiptsRoutingStatusEnum = pgEnum("source_ingestion_receipts_routing_status_enum", ["pending", "routed", "dismissed"]);
export const workflowAlertsSeverityEnum = pgEnum("workflow_alerts_severity_enum", ["critical", "warning", "information"]);
export const workflowAlertsStatusEnum = pgEnum("workflow_alerts_status_enum", ["open", "acknowledged", "resolved"]);
export const workflowAlertPoliciesAlertTypeEnum = pgEnum("workflow_alert_policies_alert_type_enum", ["source_failure", "source_health", "obligation_sla"]);
export const workflowAlertPoliciesSeverityEnum = pgEnum("workflow_alert_policies_severity_enum", ["critical", "warning", "information"]);
export const organizationControlsPiiRedactionEnum = pgEnum("organization_controls_pii_redaction_enum", ["off", "on_upload", "on_model_request"]);
export const organizationControlsPublicModelTrainingEnum = pgEnum("organization_controls_public_model_training_enum", ["disallowed", "allowed"]);
export const organizationControlsRequireMfaEnum = pgEnum("organization_controls_require_mfa_enum", ["disabled", "required"]);
export const guestAccessGrantsStatusEnum = pgEnum("guest_access_grants_status_enum", ["active", "expired", "revoked", "completed"]);
export const tradeTasksStatusEnum = pgEnum("trade_tasks_status_enum", ["open", "in_progress", "completed", "cancelled"]);
export const generatedDocumentsStatusEnum = pgEnum("generated_documents_status_enum", ["draft", "issued", "voided"]);
export const preflightWaiversDecisionEnum = pgEnum("preflight_waivers_decision_enum", ["active", "expired", "revoked"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId"),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: usersRoleEnum("role").default("trader").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  userId: int("userId").notNull().references(() => users.id),
  role: membershipsRoleEnum("role").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [uniqueIndex("membership_unique").on(table.organizationId, table.userId)]);

export const trades = pgTable(
  "trades",
  {
    id: serial("id").primaryKey(),
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
    expectedShipmentDate: timestamp("expectedShipmentDate", { withTimezone: true, mode: "date" }).notNull(),
    commercialState: tradesCommercialStateEnum("commercialState").notNull().default("draft"),
    executionState: tradesExecutionStateEnum("executionState").notNull().default("not_started"),
    documentState: tradesDocumentStateEnum("documentState").notNull().default("pending"),
    logisticsState: tradesLogisticsStateEnum("logisticsState").notNull().default("planned"),
    settlementState: tradesSettlementStateEnum("settlementState").notNull().default("unconfirmed"),
    assuranceState: tradesAssuranceStateEnum("assuranceState").notNull().default("draft"),
    partyKycState: tradesPartyKycStateEnum("partyKycState").notNull().default("pending"),
    trustScore: int("trustScore").notNull().default(0),
    trustBand: tradesTrustBandEnum("trustBand").notNull().default("critical"),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
    submittedAt: timestamp("submittedAt", { withTimezone: true, mode: "date" }),
    resolvedAt: timestamp("resolvedAt", { withTimezone: true, mode: "date" }),
  },
  table => [index("trades_owner_idx").on(table.ownerId), index("trades_assurance_idx").on(table.assuranceState)]
);

export const tradeDocuments = pgTable(
  "tradeDocuments",
  {
    id: serial("id").primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    documentType: tradeDocumentsDocumentTypeEnum("documentType").notNull(),
    status: tradeDocumentsStatusEnum("status").notNull().default("pending"),
    fileName: varchar("fileName", { length: 255 }),
    fileKey: varchar("fileKey", { length: 512 }),
    fileUrl: varchar("fileUrl", { length: 1024 }),
    mimeType: varchar("mimeType", { length: 120 }),
    extractedData: json("extractedData"),
    inconsistencies: json("inconsistencies"),
    reviewerNotes: text("reviewerNotes"),
    uploadedBy: int("uploadedBy").references(() => users.id),
    reviewedBy: int("reviewedBy").references(() => users.id),
    uploadedAt: timestamp("uploadedAt", { withTimezone: true, mode: "date" }),
    reviewedAt: timestamp("reviewedAt", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [
    uniqueIndex("trade_document_type_idx").on(table.tradeId, table.documentType),
    index("trade_documents_status_idx").on(table.status),
  ]
);

export const tradeDocumentVersions = pgTable(
  "tradeDocumentVersions",
  {
    id: serial("id").primaryKey(),
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
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("document_version_idx").on(table.documentId, table.version),
    index("document_versions_trade_idx").on(table.tradeId),
  ]
);

export const tradeMessages = pgTable(
  "tradeMessages",
  {
    id: serial("id").primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    sender: varchar("sender", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    body: text("body").notNull(),
    source: varchar("source", { length: 80 }).notNull().default("email"),
    receivedAt: timestamp("receivedAt", { withTimezone: true, mode: "date" }).notNull(),
    ingestedBy: int("ingestedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  table => [index("trade_messages_trade_idx").on(table.tradeId)]
);

export const tradeObligations = pgTable(
  "tradeObligations",
  {
    id: serial("id").primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    actor: varchar("actor", { length: 180 }).notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    evidenceRequirement: varchar("evidenceRequirement", { length: 255 }),
    deadline: timestamp("deadline", { withTimezone: true, mode: "date" }),
    criticality: tradeObligationsCriticalityEnum("criticality").notNull().default("information"),
    status: tradeObligationsStatusEnum("status").notNull().default("open"),
    source: varchar("source", { length: 180 }),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("trade_obligations_trade_idx").on(table.tradeId)]
);

export const obligationTemplates = pgTable("obligationTemplates", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  name: varchar("name", { length: 180 }).notNull(),
  actor: varchar("actor", { length: 180 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  evidenceRequirement: varchar("evidenceRequirement", { length: 255 }),
  criticality: obligationTemplatesCriticalityEnum("criticality").notNull().default("information"),
  dueOffsetHours: int("dueOffsetHours"),
  releaseCondition: json("releaseCondition"),
  active: int("active").notNull().default(1),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("obligation_templates_org_idx").on(table.organizationId), index("obligation_templates_active_idx").on(table.active)]);

export const obligationDependencies = pgTable("obligationDependencies", {
  id: serial("id").primaryKey(),
  obligationId: int("obligationId").notNull().references(() => tradeObligations.id),
  dependsOnObligationId: int("dependsOnObligationId").notNull().references(() => tradeObligations.id),
  dependencyType: obligationDependenciesDependencyTypeEnum("dependencyType").notNull().default("blocks_release"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [uniqueIndex("obligation_dependency_unique_idx").on(table.obligationId, table.dependsOnObligationId), index("obligation_dependencies_obligation_idx").on(table.obligationId)]);

export const obligationEscalations = pgTable("obligationEscalations", {
  id: serial("id").primaryKey(),
  obligationId: int("obligationId").notNull().references(() => tradeObligations.id),
  level: int("level").notNull().default(1),
  reason: text("reason").notNull(),
  escalatedAt: timestamp("escalatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt", { withTimezone: true, mode: "date" }),
  escalatedBy: int("escalatedBy").references(() => users.id),
}, table => [index("obligation_escalations_obligation_idx").on(table.obligationId)]);

export const tradeExceptions = pgTable(
  "tradeExceptions",
  {
    id: serial("id").primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    documentId: int("documentId").references(() => tradeDocuments.id),
    category: tradeExceptionsCategoryEnum("category").notNull(),
    severity: tradeExceptionsSeverityEnum("severity").notNull(),
    status: tradeExceptionsStatusEnum("status").notNull().default("open"),
    title: varchar("title", { length: 255 }).notNull(),
    detail: text("detail").notNull(),
    resolutionOutcome: tradeExceptionsResolutionOutcomeEnum("resolutionOutcome"),
    resolutionRationale: text("resolutionRationale"),
    resolvedBy: int("resolvedBy").references(() => users.id),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt", { withTimezone: true, mode: "date" }),
  },
  table => [index("trade_exceptions_trade_idx").on(table.tradeId), index("trade_exceptions_status_idx").on(table.status)]
);

export const tradeEvents = pgTable(
  "tradeEvents",
  {
    id: serial("id").primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    actorId: int("actorId").references(() => users.id),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    detail: text("detail"),
    source: varchar("source", { length: 80 }).notNull().default("application"),
    beforeState: json("beforeState"),
    afterState: json("afterState"),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  table => [index("trade_events_trade_idx").on(table.tradeId), index("trade_events_created_idx").on(table.createdAt)]
);

export const partnerRequests = pgTable(
  "partnerRequests",
  {
    id: serial("id").primaryKey(),
    tradeId: int("tradeId").notNull().references(() => trades.id),
    requestedBy: int("requestedBy").notNull().references(() => users.id),
    recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
    requestType: varchar("requestType", { length: 120 }).notNull(),
    message: text("message").notNull(),
    status: partnerRequestsStatusEnum("status").notNull().default("sent"),
    scope: json("scope"),
    responseSummary: text("responseSummary"),
    responseEvidence: json("responseEvidence"),
    respondedAt: timestamp("respondedAt", { withTimezone: true, mode: "date" }),
    dueAt: timestamp("dueAt", { withTimezone: true, mode: "date" }),
    lastReminderAt: timestamp("lastReminderAt", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completedAt", { withTimezone: true, mode: "date" }),
  },
  table => [index("partner_requests_trade_idx").on(table.tradeId)]
);

export const counterparties = pgTable("counterparties", {
  id: serial("id").primaryKey(),
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
  status: counterpartiesStatusEnum("status").notNull().default("active"),
  version: int("version").notNull().default(1),
  supersedesCounterpartyId: int("supersedesCounterpartyId"),
  validFrom: timestamp("validFrom", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  validTo: timestamp("validTo", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("counterparties_org_idx").on(table.organizationId), index("counterparties_legal_idx").on(table.legalName), index("counterparties_version_idx").on(table.organizationId, table.legalName, table.version), foreignKey({ columns: [table.supersedesCounterpartyId], foreignColumns: [table.id], name: "cp_supersedes_fk" })]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
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
  validFrom: timestamp("validFrom", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  validTo: timestamp("validTo", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [uniqueIndex("product_org_sku_idx").on(table.organizationId, table.sku, table.version), foreignKey({ columns: [table.supersedesProductId], foreignColumns: [table.id], name: "product_supersedes_fk" })]);

export const tradeLines = pgTable("tradeLines", {
  id: serial("id").primaryKey(),
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
  validFrom: timestamp("validFrom", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  validTo: timestamp("validTo", { withTimezone: true, mode: "date" }),
}, table => [index("trade_lines_trade_idx").on(table.tradeId)]);

export const tradeRevisions = pgTable("tradeRevisions", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  version: int("version").notNull(),
  reason: text("reason").notNull(),
  beforeState: json("beforeState"),
  afterState: json("afterState").notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  observedAt: timestamp("observedAt", { withTimezone: true, mode: "date" }),
  recordedAt: timestamp("recordedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  recordedBy: int("recordedBy").references(() => users.id),
}, table => [uniqueIndex("trade_revision_idx").on(table.tradeId, table.version)]);

export const evidenceFields = pgTable("evidenceFields", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  documentId: int("documentId").references(() => tradeDocuments.id),
  fieldName: varchar("fieldName", { length: 120 }).notNull(),
  fieldValue: text("fieldValue").notNull(),
  authority: evidenceFieldsAuthorityEnum("authority").notNull().default("supporting"),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  sourceLocation: json("sourceLocation"),
  modelVersion: varchar("modelVersion", { length: 120 }),
  extractedAt: timestamp("extractedAt", { withTimezone: true, mode: "date" }),
  confirmedBy: int("confirmedBy").references(() => users.id),
  confirmedAt: timestamp("confirmedAt", { withTimezone: true, mode: "date" }),
  validFrom: timestamp("validFrom", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  validTo: timestamp("validTo", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("evidence_fields_trade_idx").on(table.tradeId), index("evidence_fields_document_idx").on(table.documentId)]);

export const canonicalResolutions = pgTable("canonicalResolutions", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull(),
  fieldName: varchar("fieldName", { length: 120 }).notNull(),
  selectedEvidenceFieldId: int("selectedEvidenceFieldId"),
  selectedValue: text("selectedValue").notNull(),
  conflictingEvidenceFieldIds: json("conflictingEvidenceFieldIds"),
  rationale: text("rationale").notNull(),
  policyContext: json("policyContext"),
  resolvedBy: int("resolvedBy").notNull(),
  resolvedAt: timestamp("resolvedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
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

export const policyPacks = pgTable("policyPacks", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  name: varchar("name", { length: 180 }).notNull(),
  scope: policyPacksScopeEnum("scope").notNull(),
  status: policyPacksStatusEnum("status").notNull().default("draft"),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("policy_packs_org_idx").on(table.organizationId)]);

export const policyVersions = pgTable("policyVersions", {
  id: serial("id").primaryKey(),
  policyPackId: int("policyPackId").notNull().references(() => policyPacks.id),
  version: int("version").notNull(),
  rules: json("rules").notNull(),
  effectiveFrom: timestamp("effectiveFrom", { withTimezone: true, mode: "date" }).notNull(),
  effectiveTo: timestamp("effectiveTo", { withTimezone: true, mode: "date" }),
  source: varchar("source", { length: 180 }),
  jurisdiction: varchar("jurisdiction", { length: 120 }),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [uniqueIndex("policy_version_idx").on(table.policyPackId, table.version)]);

export const policyObligationBindings = pgTable("policyObligationBindings", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull(),
  policyPackId: int("policyPackId").notNull(),
  obligationTemplateId: int("obligationTemplateId").notNull(),
  counterpartyId: int("counterpartyId"),
  productId: int("productId"),
  relationshipRole: policyObligationBindingsRelationshipRoleEnum("relationshipRole").notNull().default("any"),
  status: policyObligationBindingsStatusEnum("status").notNull().default("active"),
  effectiveFrom: timestamp("effectiveFrom", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  effectiveTo: timestamp("effectiveTo", { withTimezone: true, mode: "date" }),
  source: varchar("source", { length: 180 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
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

export const preflightRuns = pgTable("preflightRuns", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  gate: varchar("gate", { length: 80 }).notNull(),
  status: preflightRunsStatusEnum("status").notNull(),
  checks: json("checks").notNull(),
  policySnapshot: json("policySnapshot"),
  evidenceSnapshot: json("evidenceSnapshot"),
  runBy: int("runBy").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("preflight_runs_trade_idx").on(table.tradeId), index("preflight_runs_gate_idx").on(table.gate)]);

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").references(() => trades.id),
  exceptionId: int("exceptionId").references(() => tradeExceptions.id),
  type: varchar("type", { length: 120 }).notNull(),
  status: approvalsStatusEnum("status").notNull().default("pending"),
  requestedBy: int("requestedBy").notNull().references(() => users.id),
  approverId: int("approverId").references(() => users.id),
  reason: text("reason").notNull(),
  decisionReason: text("decisionReason"),
  evidence: json("evidence"),
  decidedAt: timestamp("decidedAt", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("approvals_trade_idx").on(table.tradeId), index("approvals_status_idx").on(table.status)]);

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  mode: shipmentsModeEnum("mode").notNull(),
  carrier: varchar("carrier", { length: 180 }),
  forwarder: varchar("forwarder", { length: 180 }),
  bookingReference: varchar("bookingReference", { length: 160 }),
  containerReferences: json("containerReferences"),
  origin: varchar("origin", { length: 180 }),
  destination: varchar("destination", { length: 180 }),
  etd: timestamp("etd", { withTimezone: true, mode: "date" }),
  eta: timestamp("eta", { withTimezone: true, mode: "date" }),
  vessel: varchar("vessel", { length: 180 }),
  voyage: varchar("voyage", { length: 120 }),
  cutoffs: json("cutoffs"),
  status: shipmentsStatusEnum("status").notNull().default("planned"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("shipments_org_idx").on(table.organizationId)]);

export const shipmentAllocations = pgTable("shipmentAllocations", {
  id: serial("id").primaryKey(),
  shipmentId: int("shipmentId").notNull().references(() => shipments.id),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  allocatedQuantity: decimal("allocatedQuantity", { precision: 18, scale: 3 }),
  allocatedValue: decimal("allocatedValue", { precision: 18, scale: 2 }),
}, table => [index("shipment_allocations_trade_idx").on(table.tradeId)]);

export const shipmentEvents = pgTable("shipmentEvents", {
  id: serial("id").primaryKey(),
  shipmentId: int("shipmentId").notNull().references(() => shipments.id),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  location: varchar("location", { length: 180 }),
  plannedAt: timestamp("plannedAt", { withTimezone: true, mode: "date" }),
  actualAt: timestamp("actualAt", { withTimezone: true, mode: "date" }),
  source: varchar("source", { length: 80 }).notNull().default("manual"),
  rawPayload: json("rawPayload"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("shipment_events_shipment_idx").on(table.shipmentId)]);

export const paymentTerms = pgTable("paymentTerms", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  method: paymentTermsMethodEnum("method").notNull(),
  depositPercent: decimal("depositPercent", { precision: 5, scale: 2 }),
  presentationDays: int("presentationDays"),
  latestShipmentDate: timestamp("latestShipmentDate", { withTimezone: true, mode: "date" }),
  dueDate: timestamp("dueDate", { withTimezone: true, mode: "date" }),
  lcReference: varchar("lcReference", { length: 160 }),
  specialClauses: json("specialClauses"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("payment_terms_trade_idx").on(table.tradeId)]);

export const paymentRecords = pgTable("paymentRecords", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  paymentTermId: int("paymentTermId").references(() => paymentTerms.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: paymentRecordsStatusEnum("status").notNull().default("expected"),
  evidenceDocumentId: int("evidenceDocumentId").references(() => tradeDocuments.id),
  recordedAt: timestamp("recordedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("payment_records_trade_idx").on(table.tradeId)]);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  exceptionId: int("exceptionId").references(() => tradeExceptions.id),
  parentId: int("parentId"),
  authorId: int("authorId").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  editedAt: timestamp("editedAt", { withTimezone: true, mode: "date" }),
}, table => [index("comments_trade_idx").on(table.tradeId)]);

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  providerType: integrationsProviderTypeEnum("providerType").notNull(),
  providerName: varchar("providerName", { length: 180 }).notNull(),
  status: integrationsStatusEnum("status").notNull().default("disconnected"),
  configuration: json("configuration"),
  healthMessage: text("healthMessage"),
  lastSyncedAt: timestamp("lastSyncedAt", { withTimezone: true, mode: "date" }),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("integrations_org_idx").on(table.organizationId), index("integrations_provider_idx").on(table.providerType)]);

export const integrationRuns = pgTable("integrationRuns", {
  id: serial("id").primaryKey(),
  integrationId: int("integrationId").notNull().references(() => integrations.id),
  runType: varchar("runType", { length: 100 }).notNull(),
  status: integrationRunsStatusEnum("status").notNull().default("queued"),
  inputSummary: json("inputSummary"),
  outputSummary: json("outputSummary"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt", { withTimezone: true, mode: "date" }),
  completedAt: timestamp("completedAt", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("integration_runs_integration_idx").on(table.integrationId), index("integration_runs_status_idx").on(table.status)]);

export const integrationRunAttempts = pgTable("integrationRunAttempts", {
  id: serial("id").primaryKey(),
  integrationRunId: int("integrationRunId").notNull().references(() => integrationRuns.id),
  attempt: int("attempt").notNull(),
  status: integrationRunAttemptsStatusEnum("status").notNull(),
  errorMessage: text("errorMessage"),
  detail: json("detail"),
  startedAt: timestamp("startedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completedAt", { withTimezone: true, mode: "date" }),
}, table => [uniqueIndex("integration_attempt_unique_idx").on(table.integrationRunId, table.attempt), index("integration_attempt_run_idx").on(table.integrationRunId)]);

export const sourceIngestionReceipts = pgTable("sourceIngestionReceipts", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").references(() => trades.id),
  integrationId: int("integrationId").references(() => integrations.id),
  sourceType: sourceIngestionReceiptsSourceTypeEnum("sourceType").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  mimeType: varchar("mimeType", { length: 120 }),
  payloadHash: varchar("payloadHash", { length: 128 }),
  rawPayload: json("rawPayload"),
  normalizedStatus: sourceIngestionReceiptsNormalizedStatusEnum("normalizedStatus").notNull().default("queued"),
  routingStatus: sourceIngestionReceiptsRoutingStatusEnum("routingStatus").notNull().default("routed"),
  routingContext: json("routingContext"),
  routedAt: timestamp("routedAt", { withTimezone: true, mode: "date" }),
  routedBy: int("routedBy").references(() => users.id),
  errorMessage: text("errorMessage"),
  replayCount: int("replayCount").notNull().default(0),
  receivedAt: timestamp("receivedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  normalizedAt: timestamp("normalizedAt", { withTimezone: true, mode: "date" }),
  createdBy: int("createdBy").references(() => users.id),
}, table => [index("source_receipts_org_idx").on(table.organizationId), index("source_receipts_trade_idx").on(table.tradeId), index("source_receipts_status_idx").on(table.normalizedStatus), index("source_receipts_routing_idx").on(table.routingStatus), index("source_receipts_hash_idx").on(table.payloadHash)]);

export const workflowAlerts = pgTable("workflowAlerts", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  integrationId: int("integrationId").references(() => integrations.id),
  integrationRunId: int("integrationRunId").references(() => integrationRuns.id),
  severity: workflowAlertsSeverityEnum("severity").notNull().default("warning"),
  status: workflowAlertsStatusEnum("status").notNull().default("open"),
  title: varchar("title", { length: 255 }).notNull(),
  detail: text("detail").notNull(),
  dedupeKey: varchar("dedupeKey", { length: 180 }),
  occurrenceCount: int("occurrenceCount").notNull().default(1),
  firstSeenAt: timestamp("firstSeenAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt", { withTimezone: true, mode: "date" }),
  acknowledgedBy: int("acknowledgedBy").references(() => users.id),
  resolvedAt: timestamp("resolvedAt", { withTimezone: true, mode: "date" }),
}, table => [index("workflow_alert_org_idx").on(table.organizationId), index("workflow_alert_status_idx").on(table.status), uniqueIndex("workflow_alert_dedupe_idx").on(table.organizationId, table.dedupeKey)]);

export const workflowAlertPolicies = pgTable("workflowAlertPolicies", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull(),
  alertType: workflowAlertPoliciesAlertTypeEnum("alertType").notNull(),
  enabled: int("enabled").notNull().default(1),
  severity: workflowAlertPoliciesSeverityEnum("severity").notNull().default("warning"),
  threshold: int("threshold").notNull().default(1),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [uniqueIndex("alert_policy_org_type_idx").on(table.organizationId, table.alertType), index("alert_policy_org_idx").on(table.organizationId), foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "alpol_org_fk" }), foreignKey({ columns: [table.updatedBy], foreignColumns: [users.id], name: "alpol_user_fk" })]);

export const operationalSchedules = pgTable("operationalSchedules", {
  id: serial("id").primaryKey(),
  scheduleKey: varchar("scheduleKey", { length: 80 }).notNull().unique(),
  taskUid: varchar("taskUid", { length: 65 }).unique(),
  cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
  enabled: int("enabled").notNull().default(1),
  lastExecutedAt: timestamp("lastExecutedAt", { withTimezone: true, mode: "date" }),
  lastResult: json("lastResult"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("operational_schedules_task_uid_idx").on(table.taskUid)]);

export const externalReferences = pgTable("externalReferences", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").references(() => trades.id),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  providerName: varchar("providerName", { length: 180 }).notNull(),
  externalId: varchar("externalId", { length: 255 }).notNull(),
  payload: json("payload"),
  observedAt: timestamp("observedAt", { withTimezone: true, mode: "date" }).notNull(),
  recordedAt: timestamp("recordedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [uniqueIndex("external_reference_unique_idx").on(table.organizationId, table.providerName, table.entityType, table.externalId), index("external_reference_trade_idx").on(table.tradeId)]);

export const importMappings = pgTable("importMappings", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  sourceName: varchar("sourceName", { length: 180 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  mapping: json("mapping").notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("import_mappings_org_idx").on(table.organizationId)]);

export const organizationControls = pgTable("organizationControls", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id).unique(),
  dataRetentionDays: int("dataRetentionDays").notNull().default(2555),
  allowedAiProviders: json("allowedAiProviders"),
  regionalProcessing: varchar("regionalProcessing", { length: 80 }).default("default"),
  piiRedaction: organizationControlsPiiRedactionEnum("piiRedaction").notNull().default("on_model_request"),
  publicModelTraining: organizationControlsPublicModelTrainingEnum("publicModelTraining").notNull().default("disallowed"),
  requireMfa: organizationControlsRequireMfaEnum("requireMfa").notNull().default("disabled"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const capabilityGrants = pgTable("capabilityGrants", {
  id: serial("id").primaryKey(),
  membershipId: int("membershipId").notNull().references(() => memberships.id),
  capability: varchar("capability", { length: 120 }).notNull(),
  grantedBy: int("grantedBy").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [uniqueIndex("capability_grant_unique_idx").on(table.membershipId, table.capability), index("capability_grant_membership_idx").on(table.membershipId)]);

export const guestAccessGrants = pgTable("guestAccessGrants", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  tokenHash: varchar("tokenHash", { length: 255 }).notNull().unique(),
  scope: json("scope").notNull(),
  status: guestAccessGrantsStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" }).notNull(),
  accessedAt: timestamp("accessedAt", { withTimezone: true, mode: "date" }),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("guest_access_trade_idx").on(table.tradeId), index("guest_access_org_idx").on(table.organizationId)]);

export const auditRecords = pgTable("auditRecords", {
  id: serial("id").primaryKey(),
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
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("audit_records_org_idx").on(table.organizationId), index("audit_records_object_idx").on(table.objectType, table.objectId), index("audit_records_created_idx").on(table.createdAt)]);

export const tradeTasks = pgTable("tradeTasks", {
  id: serial("id").primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  exceptionId: int("exceptionId").references(() => tradeExceptions.id),
  obligationId: int("obligationId").references(() => tradeObligations.id),
  title: varchar("title", { length: 255 }).notNull(),
  detail: text("detail").notNull(),
  assigneeId: int("assigneeId").references(() => users.id),
  deadline: timestamp("deadline", { withTimezone: true, mode: "date" }),
  status: tradeTasksStatusEnum("status").notNull().default("open"),
  completedAt: timestamp("completedAt", { withTimezone: true, mode: "date" }),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("trade_tasks_trade_idx").on(table.tradeId), index("trade_tasks_assignee_idx").on(table.assigneeId), index("trade_tasks_status_idx").on(table.status)]);

export const generatedDocuments = pgTable("generatedDocuments", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  documentType: varchar("documentType", { length: 120 }).notNull(),
  templateVersion: varchar("templateVersion", { length: 120 }).notNull(),
  status: generatedDocumentsStatusEnum("status").notNull().default("draft"),
  dataSnapshot: json("dataSnapshot").notNull(),
  renderedContent: text("renderedContent").notNull(),
  contentHash: varchar("contentHash", { length: 128 }).notNull(),
  issuedBy: int("issuedBy").references(() => users.id),
  issuedAt: timestamp("issuedAt", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("generated_documents_trade_idx").on(table.tradeId), index("generated_documents_status_idx").on(table.status)]);

export const preflightWaivers = pgTable("preflightWaivers", {
  id: serial("id").primaryKey(),
  tradeId: int("tradeId").notNull().references(() => trades.id),
  policyVersionId: int("policyVersionId").references(() => policyVersions.id),
  ruleKey: varchar("ruleKey", { length: 160 }).notNull(),
  reason: text("reason").notNull(),
  decision: preflightWaiversDecisionEnum("decision").notNull().default("active"),
  expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" }).notNull(),
  approvedBy: int("approvedBy").notNull().references(() => users.id),
  approvedAt: timestamp("approvedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, table => [index("preflight_waivers_trade_idx").on(table.tradeId), index("preflight_waivers_policy_idx").on(table.policyVersionId), index("preflight_waivers_decision_idx").on(table.decision)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type TradeDocument = typeof tradeDocuments.$inferSelect;
