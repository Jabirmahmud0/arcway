import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  memberships,
  organizations,
  counterparties,
  products,
  tradeLines,
  tradeRevisions,
  evidenceFields,
  policyPacks,
  policyVersions,
  preflightRuns,
  approvals,
  shipments,
  shipmentAllocations,
  shipmentEvents,
  paymentTerms,
  paymentRecords,
  comments,
  integrations,
  integrationRuns,
  integrationRunAttempts,
  sourceIngestionReceipts,
  workflowAlerts,
  workflowAlertPolicies,
  operationalSchedules,
  externalReferences,
  importMappings,
  organizationControls,
  capabilityGrants,
  guestAccessGrants,
  auditRecords,
  tradeTasks,
  generatedDocuments,
  preflightWaivers,
  partnerRequests,
  InsertUser,
  tradeDocumentVersions,
  tradeDocuments,
  tradeEvents,
  tradeExceptions,
  tradeMessages,
  tradeObligations,
  obligationTemplates,
  obligationDependencies,
  obligationEscalations,
  canonicalResolutions,
  policyObligationBindings,
  trades,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { shouldEscalateSourceHealth } from "./alertPolicy";
import { buildPolicyObligationPreview } from "./policyApplication";
import { buildHistoricalShadowReview } from "./shadowAuditReview";
import { redactRoutingContextForRole } from "./sourceReceiptVisibility";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "reviewer" : "trader");
  await db.insert(users).values({
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role,
    lastSignedIn: user.lastSignedIn ?? new Date(),
  }).onDuplicateKeyUpdate({
    set: { name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, role, lastSignedIn: new Date() },
  });
  const [persisted] = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  if (persisted && !persisted.organizationId) {
    const slug = `workspace-${persisted.id}-${persisted.openId.slice(-8).toLowerCase()}`;
    const result = await db.insert(organizations).values({ name: `${persisted.name || "ARCWAY"} Workspace`, slug });
    const organizationId = Number(result[0].insertId);
    await db.update(users).set({ organizationId }).where(eq(users.id, persisted.id));
    await db.insert(memberships).values({ organizationId, userId: persisted.id, role: persisted.role });
    await db.update(trades).set({ organizationId }).where(eq(trades.ownerId, persisted.id));
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createTrade(input: {
  ownerId: number;
  organizationId?: number | null;
  reference: string;
  buyerName: string;
  buyerCountry: string;
  sellerName: string;
  sellerCountry: string;
  commodity: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalValue: string;
  currency: string;
  incoterm: string;
  originCountry: string;
  destinationCountry: string;
  expectedShipmentDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(trades).values(input);
  return Number(result[0].insertId);
}

export async function createDocumentPlaceholders(tradeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(tradeDocuments).values([
    { tradeId, documentType: "commercial invoice" }, { tradeId, documentType: "packing list" },
    { tradeId, documentType: "bill of lading" }, { tradeId, documentType: "certificate of origin" },
    { tradeId, documentType: "inspection certificate" }, { tradeId, documentType: "LC/payment terms" },
  ]);
}

export async function appendTradeEvent(input: {
  tradeId: number;
  actorId?: number;
  eventType: string;
  title: string;
  detail?: string;
  source?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(tradeEvents).values({ ...input, source: input.source ?? "application" });
}

export async function getTradeById(tradeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  return rows[0];
}

export async function getTradeWorkspace(tradeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  if (!trade) return undefined;
  const [documents, events, exceptions, obligations, lines, revisions, fields, runs, shipmentLinks, terms, decisions, discussion, tasks, drafts, waivers, resolutionRows] = await Promise.all([
    db.select().from(tradeDocuments).where(eq(tradeDocuments.tradeId, tradeId)),
    db.select().from(tradeEvents).where(eq(tradeEvents.tradeId, tradeId)).orderBy(desc(tradeEvents.createdAt)),
    db.select().from(tradeExceptions).where(eq(tradeExceptions.tradeId, tradeId)).orderBy(desc(tradeExceptions.createdAt)),
    db.select().from(tradeObligations).where(eq(tradeObligations.tradeId, tradeId)).orderBy(desc(tradeObligations.deadline)),
    db.select().from(tradeLines).where(eq(tradeLines.tradeId, tradeId)).orderBy(tradeLines.sequence),
    db.select().from(tradeRevisions).where(eq(tradeRevisions.tradeId, tradeId)).orderBy(desc(tradeRevisions.recordedAt)),
    db.select().from(evidenceFields).where(eq(evidenceFields.tradeId, tradeId)).orderBy(desc(evidenceFields.createdAt)),
    db.select().from(preflightRuns).where(eq(preflightRuns.tradeId, tradeId)).orderBy(desc(preflightRuns.createdAt)),
    db.select().from(shipmentAllocations).where(eq(shipmentAllocations.tradeId, tradeId)),
    db.select().from(paymentTerms).where(eq(paymentTerms.tradeId, tradeId)),
    db.select().from(approvals).where(eq(approvals.tradeId, tradeId)).orderBy(desc(approvals.createdAt)),
    db.select().from(comments).where(eq(comments.tradeId, tradeId)).orderBy(desc(comments.createdAt)),
    db.select().from(tradeTasks).where(eq(tradeTasks.tradeId, tradeId)).orderBy(desc(tradeTasks.createdAt)),
    db.select().from(generatedDocuments).where(eq(generatedDocuments.tradeId, tradeId)).orderBy(desc(generatedDocuments.createdAt)),
    db.select().from(preflightWaivers).where(eq(preflightWaivers.tradeId, tradeId)).orderBy(desc(preflightWaivers.createdAt)),
    db.select().from(canonicalResolutions).where(eq(canonicalResolutions.tradeId, tradeId)).orderBy(desc(canonicalResolutions.resolvedAt)),
  ]);
  const documentVersions = await db.select().from(tradeDocumentVersions).where(eq(tradeDocumentVersions.tradeId, tradeId)).orderBy(desc(tradeDocumentVersions.createdAt));
  const obligationIds = obligations.map(obligation => obligation.id);
  const [obligationDependenciesRows, obligationEscalationsRows] = obligationIds.length ? await Promise.all([
    db.select().from(obligationDependencies).where(sql`${obligationDependencies.obligationId} in (${sql.join(obligationIds.map(id => sql`${id}`), sql`, `)})`),
    db.select().from(obligationEscalations).where(sql`${obligationEscalations.obligationId} in (${sql.join(obligationIds.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(obligationEscalations.escalatedAt)),
  ]) : [[], []];
  const shipmentIds = shipmentLinks.map(link => link.shipmentId);
  const shipmentRows = shipmentIds.length ? await db.select().from(shipments).where(sql`${shipments.id} in (${sql.join(shipmentIds.map(id => sql`${id}`), sql`, `)})`) : [];
  const shipmentEventsRows = shipmentIds.length ? await db.select().from(shipmentEvents).where(sql`${shipmentEvents.shipmentId} in (${sql.join(shipmentIds.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(shipmentEvents.createdAt)) : [];
  const paymentRows = await db.select().from(paymentRecords).where(eq(paymentRecords.tradeId, tradeId)).orderBy(desc(paymentRecords.recordedAt));
  return { trade, documents, documentVersions, events, exceptions, obligations, obligationDependencies: obligationDependenciesRows, obligationEscalations: obligationEscalationsRows, lines, revisions, fields, canonicalResolutions: resolutionRows, preflightRuns: runs, shipmentLinks, shipments: shipmentRows, shipmentEvents: shipmentEventsRows, paymentTerms: terms, paymentRecords: paymentRows, approvals: decisions, comments: discussion, tasks, generatedDocuments: drafts, preflightWaivers: waivers };
}

export async function createEvidenceFields(input: Array<{ tradeId: number; documentId?: number; fieldName: string; fieldValue: string; authority?: "canonical" | "authoritative" | "supporting" | "conflicting"; confidence?: string; sourceLocation?: Record<string, unknown>; modelVersion?: string }>) {
  if (!input.length) return;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(evidenceFields).values(input.map(field => ({ ...field, authority: field.authority ?? "supporting", extractedAt: new Date() })));
}

export async function createPreflightRun(input: { tradeId: number; gate: string; status: "ready" | "ready_with_warnings" | "at_risk" | "blocked" | "insufficient_data"; checks: unknown; policySnapshot?: unknown; evidenceSnapshot?: unknown; runBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(preflightRuns).values(input);
}

export async function createPreflightWaiver(input: { tradeId: number; policyVersionId?: number; ruleKey: string; reason: string; expiresAt: Date; approvedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(preflightWaivers).values(input);
  return Number(result[0].insertId);
}

export async function revokePreflightWaiver(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(preflightWaivers).set({ decision: "revoked" }).where(eq(preflightWaivers.id, id));
}

export async function createObligationTemplate(input: { organizationId: number; name: string; actor: string; action: string; evidenceRequirement?: string; criticality?: "critical" | "warning" | "information"; dueOffsetHours?: number; releaseCondition?: unknown; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(obligationTemplates).values({ ...input, criticality: input.criticality ?? "information", active: 1 });
  return Number(result[0].insertId);
}

export async function listObligationTemplates(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(obligationTemplates).where(eq(obligationTemplates.organizationId, organizationId)).orderBy(desc(obligationTemplates.createdAt));
}

export async function createTradeObligation(input: { tradeId: number; actor: string; action: string; evidenceRequirement?: string; deadline?: Date; criticality?: "critical" | "warning" | "information"; source?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(tradeObligations).values({ ...input, criticality: input.criticality ?? "information", status: "open" });
  return Number(result[0].insertId);
}

export async function createCanonicalResolution(input: { tradeId: number; fieldName: string; selectedEvidenceFieldId?: number; selectedValue: string; conflictingEvidenceFieldIds?: number[]; rationale: string; policyContext?: unknown; resolvedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const prior = (await db.select().from(canonicalResolutions).where(sql`${canonicalResolutions.tradeId} = ${input.tradeId} and ${canonicalResolutions.fieldName} = ${input.fieldName} and ${canonicalResolutions.active} = 1`).orderBy(desc(canonicalResolutions.resolvedAt)).limit(1))[0];
  if (prior) await db.update(canonicalResolutions).set({ active: 0 }).where(eq(canonicalResolutions.id, prior.id));
  const result = await db.insert(canonicalResolutions).values({ ...input, previousResolutionId: prior?.id, conflictingEvidenceFieldIds: input.conflictingEvidenceFieldIds ?? null, active: 1 });
  return Number(result[0].insertId);
}

export async function addObligationDependency(input: { obligationId: number; dependsOnObligationId: number; dependencyType?: "blocks_release" | "blocks_task" | "evidence_prerequisite" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(obligationDependencies).values({ ...input, dependencyType: input.dependencyType ?? "blocks_release" });
}

export async function escalateObligation(input: { obligationId: number; reason: string; escalatedBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(obligationEscalations).where(eq(obligationEscalations.obligationId, input.obligationId));
  await db.insert(obligationEscalations).values({ ...input, level: existing.length + 1 });
  await db.update(tradeObligations).set({ status: "overdue" }).where(eq(tradeObligations.id, input.obligationId));
}

export async function listOrganizationMasters(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [counterpartyRows, productRows, policyRows, bindingRows] = await Promise.all([
    db.select().from(counterparties).where(eq(counterparties.organizationId, organizationId)).orderBy(desc(counterparties.updatedAt)),
    db.select().from(products).where(eq(products.organizationId, organizationId)).orderBy(desc(products.updatedAt)),
    db.select().from(policyPacks).where(eq(policyPacks.organizationId, organizationId)).orderBy(desc(policyPacks.updatedAt)),
    db.select().from(policyObligationBindings).where(eq(policyObligationBindings.organizationId, organizationId)).orderBy(desc(policyObligationBindings.createdAt)),
  ]);
  return { counterparties: counterpartyRows, products: productRows, policyPacks: policyRows, policyBindings: bindingRows };
}

export async function createCounterparty(input: { organizationId: number; legalName: string; countryCode: string; tradingNames?: unknown; contacts?: unknown; defaultTerms?: unknown; requiredCertificates?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(counterparties).values(input);
  return Number(result[0].insertId);
}

export async function createProduct(input: { organizationId: number; sku: string; description: string; buyerSku?: string; countryOfOrigin?: string; hsClassification?: string; leadTimeDays?: number; certifications?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(products).values(input);
  return Number(result[0].insertId);
}

export async function createCounterpartyVersion(input: { organizationId: number; sourceId: number; legalName?: string; countryCode?: string; tradingNames?: string[]; requiredCertificates?: unknown; contacts?: unknown; defaultTerms?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const source = (await db.select().from(counterparties).where(and(eq(counterparties.id, input.sourceId), eq(counterparties.organizationId, input.organizationId))).limit(1))[0];
  if (!source) throw new Error("Counterparty master not found in this workspace");
  const now = new Date();
  await db.update(counterparties).set({ validTo: now }).where(eq(counterparties.id, source.id));
  const result = await db.insert(counterparties).values({ organizationId: source.organizationId, legalName: input.legalName ?? source.legalName, tradingNames: input.tradingNames ?? source.tradingNames, countryCode: (input.countryCode ?? source.countryCode).toUpperCase(), taxId: source.taxId, addresses: source.addresses, contacts: input.contacts ?? source.contacts, bankDetails: source.bankDetails, defaultTerms: input.defaultTerms ?? source.defaultTerms, documentPreferences: source.documentPreferences, requiredCertificates: input.requiredCertificates ?? source.requiredCertificates, status: source.status, version: source.version + 1, supersedesCounterpartyId: source.id, validFrom: now });
  return Number(result[0].insertId);
}

export async function createProductVersion(input: { organizationId: number; sourceId: number; description?: string; buyerSku?: string; countryOfOrigin?: string; hsClassification?: string; leadTimeDays?: number; certifications?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const source = (await db.select().from(products).where(and(eq(products.id, input.sourceId), eq(products.organizationId, input.organizationId))).limit(1))[0];
  if (!source) throw new Error("Product master not found in this workspace");
  const now = new Date();
  await db.update(products).set({ validTo: now }).where(eq(products.id, source.id));
  const result = await db.insert(products).values({ organizationId: source.organizationId, sku: source.sku, buyerSku: input.buyerSku ?? source.buyerSku, description: input.description ?? source.description, variants: source.variants, countryOfOrigin: (input.countryOfOrigin ?? source.countryOfOrigin)?.toUpperCase(), hsClassification: input.hsClassification ?? source.hsClassification, dimensions: source.dimensions, netWeight: source.netWeight, grossWeight: source.grossWeight, packing: source.packing, leadTimeDays: input.leadTimeDays ?? source.leadTimeDays, certifications: input.certifications ?? source.certifications, complianceAttributes: source.complianceAttributes, version: source.version + 1, supersedesProductId: source.id, validFrom: now });
  return Number(result[0].insertId);
}

export async function createPolicyPack(input: { organizationId: number; name: string; scope: "company" | "counterparty" | "product" | "route" | "payment" | "transport" | "jurisdiction"; ownerId: number; rules: unknown; jurisdiction?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const policy = await db.insert(policyPacks).values({ organizationId: input.organizationId, name: input.name, scope: input.scope, status: "active", ownerId: input.ownerId });
  const policyPackId = Number(policy[0].insertId);
  await db.insert(policyVersions).values({ policyPackId, version: 1, rules: input.rules, effectiveFrom: new Date(), jurisdiction: input.jurisdiction, createdBy: input.ownerId });
  return policyPackId;
}

export async function getActivePolicySnapshots(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const packs = await db.select().from(policyPacks).where(sql`${policyPacks.organizationId} = ${organizationId} and ${policyPacks.status} = 'active'`);
  if (!packs.length) return [];
  const packIds = packs.map(pack => pack.id);
  const versions = await db.select().from(policyVersions).where(sql`${policyVersions.policyPackId} in (${sql.join(packIds.map(id => sql`${id}`), sql`, `)})`);
  const now = new Date();
  return packs.flatMap(pack => {
    const activeVersion = versions.filter(version => version.policyPackId === pack.id && version.effectiveFrom <= now && (!version.effectiveTo || version.effectiveTo > now)).sort((a, b) => b.version - a.version)[0];
    return activeVersion ? [{ policyPackId: pack.id, policyName: pack.name, scope: pack.scope, policyVersionId: activeVersion.id, version: activeVersion.version, rules: activeVersion.rules, jurisdiction: activeVersion.jurisdiction, effectiveFrom: activeVersion.effectiveFrom }] : [];
  });
}

export async function getPolicyGovernanceData(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const packs = await db.select().from(policyPacks).where(eq(policyPacks.organizationId, organizationId)).orderBy(desc(policyPacks.updatedAt));
  const packIds = packs.map(pack => pack.id);
  const versions = packIds.length ? await db.select().from(policyVersions).where(sql`${policyVersions.policyPackId} in (${sql.join(packIds.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(policyVersions.createdAt)) : [];
  return { packs, versions };
}

export async function createPolicyObligationBinding(input: { organizationId: number; policyPackId: number; obligationTemplateId: number; counterpartyId?: number; productId?: number; relationshipRole: "buyer" | "supplier" | "forwarder" | "carrier" | "bank" | "inspector" | "any"; source?: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [policy, template, counterparty, product] = await Promise.all([
    db.select().from(policyPacks).where(and(eq(policyPacks.id, input.policyPackId), eq(policyPacks.organizationId, input.organizationId))).limit(1),
    db.select().from(obligationTemplates).where(and(eq(obligationTemplates.id, input.obligationTemplateId), eq(obligationTemplates.organizationId, input.organizationId))).limit(1),
    input.counterpartyId ? db.select().from(counterparties).where(and(eq(counterparties.id, input.counterpartyId), eq(counterparties.organizationId, input.organizationId))).limit(1) : Promise.resolve([undefined]),
    input.productId ? db.select().from(products).where(and(eq(products.id, input.productId), eq(products.organizationId, input.organizationId))).limit(1) : Promise.resolve([undefined]),
  ]);
  if (!policy[0] || !template[0] || (input.counterpartyId && !counterparty[0]) || (input.productId && !product[0])) throw new Error("Policy binding references an object outside this workspace");
  const result = await db.insert(policyObligationBindings).values({ ...input, status: "active" });
  return Number(result[0].insertId);
}

export async function getPolicyObligationPreview(tradeId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const workspace = await getTradeWorkspace(tradeId);
  if (!workspace || workspace.trade.organizationId !== organizationId) throw new Error("Trade Twin not found in this workspace");
  const [activePolicies, bindingRows, masterRows, templateRows] = await Promise.all([
    getActivePolicySnapshots(organizationId),
    db.select().from(policyObligationBindings).where(and(eq(policyObligationBindings.organizationId, organizationId), eq(policyObligationBindings.status, "active"))),
    listOrganizationMasters(organizationId),
    listObligationTemplates(organizationId),
  ]);
  const now = new Date();
  const policyByPack = new Map(activePolicies.map(item => [item.policyPackId, item]));
  const counterpartyById = new Map(masterRows.counterparties.map(item => [item.id, item]));
  const templateById = new Map(templateRows.map(item => [item.id, item]));
  const eligibleBindings = bindingRows.flatMap(binding => {
    const policy = policyByPack.get(binding.policyPackId);
    const template = templateById.get(binding.obligationTemplateId);
    if (!policy || !template || binding.effectiveFrom > now || (binding.effectiveTo && binding.effectiveTo <= now)) return [];
    return [{ ...binding, policyName: policy.policyName, policyVersionId: policy.policyVersionId, policyVersion: policy.version, rules: policy.rules, jurisdiction: policy.jurisdiction, counterpartyName: binding.counterpartyId ? counterpartyById.get(binding.counterpartyId)?.legalName ?? null : null, template }];
  });
  return buildPolicyObligationPreview({ trade: workspace.trade, paymentMethod: workspace.paymentTerms[0]?.method, productIds: workspace.lines.flatMap(line => line.productId ? [line.productId] : []), bindings: eligibleBindings, existingSources: workspace.obligations.map(obligation => obligation.source ?? "") });
}

export async function createShipment(input: { organizationId: number; tradeId: number; mode: "sea" | "air" | "road" | "rail" | "multimodal"; carrier?: string; forwarder?: string; bookingReference?: string; origin?: string; destination?: string; etd?: Date; eta?: Date; vessel?: string; voyage?: string; allocatedQuantity?: string; allocatedValue?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(shipments).values({ organizationId: input.organizationId, mode: input.mode, carrier: input.carrier, forwarder: input.forwarder, bookingReference: input.bookingReference, origin: input.origin, destination: input.destination, etd: input.etd, eta: input.eta, vessel: input.vessel, voyage: input.voyage });
  const shipmentId = Number(result[0].insertId);
  await db.insert(shipmentAllocations).values({ shipmentId, tradeId: input.tradeId, allocatedQuantity: input.allocatedQuantity, allocatedValue: input.allocatedValue });
  return shipmentId;
}

export async function listShipmentSearchRecordsForUser(user: { id: number; role: "trader" | "reviewer"; organizationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const condition = user.role === "trader"
    ? and(eq(shipments.organizationId, user.organizationId), eq(trades.ownerId, user.id))
    : eq(shipments.organizationId, user.organizationId);
  const rows = await db.select().from(shipments).innerJoin(shipmentAllocations, eq(shipmentAllocations.shipmentId, shipments.id)).innerJoin(trades, eq(trades.id, shipmentAllocations.tradeId)).where(condition).orderBy(desc(shipments.updatedAt));
  const shipmentIds = rows.map(row => row.shipments.id);
  const events = shipmentIds.length ? await db.select().from(shipmentEvents).where(sql`${shipmentEvents.shipmentId} in (${sql.join(shipmentIds.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(shipmentEvents.actualAt), desc(shipmentEvents.plannedAt)) : [];
  return rows.map(row => ({ shipment: row.shipments, trade: row.trades, allocation: row.shipmentAllocations, events: events.filter(event => event.shipmentId === row.shipments.id) }));
}

export async function addShipmentEvent(input: { shipmentId: number; eventType: string; location?: string; plannedAt?: Date; actualAt?: Date; source?: string; rawPayload?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(shipmentEvents).values({ ...input, source: input.source ?? "manual" });
}

export async function upsertPaymentTerm(input: { tradeId: number; method: "open_account" | "advance" | "letter_of_credit" | "documentary_collection" | "other"; depositPercent?: string; presentationDays?: number; latestShipmentDate?: Date; dueDate?: Date; lcReference?: string; specialClauses?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(paymentTerms).values(input);
}

export async function recordPayment(input: { tradeId: number; paymentTermId?: number; amount: string; currency: string; status: "expected" | "received" | "overdue" | "disputed"; evidenceDocumentId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(paymentRecords).values(input);
}

export async function createApproval(input: { organizationId: number; tradeId?: number; exceptionId?: number; type: string; requestedBy: number; approverId?: number; reason: string; evidence?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(approvals).values(input);
  return Number(result[0].insertId);
}

export async function decideApproval(input: { approvalId: number; approverId: number; status: "approved" | "rejected"; decisionReason: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(approvals).set({ status: input.status, approverId: input.approverId, decisionReason: input.decisionReason, decidedAt: new Date() }).where(eq(approvals.id, input.approvalId));
}

export async function addTradeComment(input: { tradeId: number; exceptionId?: number; parentId?: number; authorId: number; body: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(comments).values(input);
}

export async function createTradeRevision(input: { tradeId: number; reason: string; beforeState?: unknown; afterState: unknown; source: string; recordedBy: number; observedAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: tradeRevisions.id }).from(tradeRevisions).where(eq(tradeRevisions.tradeId, input.tradeId));
  await db.insert(tradeRevisions).values({ ...input, version: rows.length + 1 });
}

export async function listIntegrationOperations(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [integrationRows, mappingRows, receiptRows, alertRows, alertPolicies] = await Promise.all([
    db.select().from(integrations).where(eq(integrations.organizationId, organizationId)).orderBy(desc(integrations.updatedAt)),
    db.select().from(importMappings).where(eq(importMappings.organizationId, organizationId)).orderBy(desc(importMappings.createdAt)),
    db.select().from(sourceIngestionReceipts).where(eq(sourceIngestionReceipts.organizationId, organizationId)).orderBy(desc(sourceIngestionReceipts.receivedAt)).limit(100),
    db.select().from(workflowAlerts).where(eq(workflowAlerts.organizationId, organizationId)).orderBy(desc(workflowAlerts.lastSeenAt)).limit(100),
    db.select().from(workflowAlertPolicies).where(eq(workflowAlertPolicies.organizationId, organizationId)).orderBy(workflowAlertPolicies.alertType),
  ]);
  const ids = integrationRows.map(row => row.id);
  const runRows = ids.length ? await db.select().from(integrationRuns).where(sql`${integrationRuns.integrationId} in (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(integrationRuns.createdAt)) : [];
  const runIds = runRows.map(row => row.id);
  const attempts = runIds.length ? await db.select().from(integrationRunAttempts).where(sql`${integrationRunAttempts.integrationRunId} in (${sql.join(runIds.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(integrationRunAttempts.startedAt)) : [];
  return { integrations: integrationRows, runs: runRows, attempts, mappings: mappingRows, receipts: receiptRows, alerts: alertRows, alertPolicies };
}

export async function listSourceIngestionReceiptsForUser(input: { userId: number; role: "trader" | "reviewer"; organizationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const condition = input.role === "trader"
    ? sql`${sourceIngestionReceipts.organizationId} = ${input.organizationId} and ((${sourceIngestionReceipts.tradeId} is null and ${sourceIngestionReceipts.createdBy} = ${input.userId}) or ${trades.ownerId} = ${input.userId})`
    : eq(sourceIngestionReceipts.organizationId, input.organizationId);
  const rows = await db.select({
    id: sourceIngestionReceipts.id,
    tradeId: sourceIngestionReceipts.tradeId,
    sourceType: sourceIngestionReceipts.sourceType,
    fileName: sourceIngestionReceipts.fileName,
    fileUrl: sourceIngestionReceipts.fileUrl,
    mimeType: sourceIngestionReceipts.mimeType,
    payloadHash: sourceIngestionReceipts.payloadHash,
    rawPayload: sourceIngestionReceipts.rawPayload,
    normalizedStatus: sourceIngestionReceipts.normalizedStatus,
    routingStatus: sourceIngestionReceipts.routingStatus,
    routingContext: sourceIngestionReceipts.routingContext,
    routedAt: sourceIngestionReceipts.routedAt,
    errorMessage: sourceIngestionReceipts.errorMessage,
    replayCount: sourceIngestionReceipts.replayCount,
    receivedAt: sourceIngestionReceipts.receivedAt,
    normalizedAt: sourceIngestionReceipts.normalizedAt,
    tradeReference: trades.reference,
    buyerName: trades.buyerName,
    sellerName: trades.sellerName,
  }).from(sourceIngestionReceipts).leftJoin(trades, eq(sourceIngestionReceipts.tradeId, trades.id)).where(condition).orderBy(desc(sourceIngestionReceipts.receivedAt)).limit(100);
  return rows.map(row => redactRoutingContextForRole(input.role, row));
}

export async function getImportMappingForUser(input: { mappingId: number; userId: number; role: "trader" | "reviewer"; organizationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const condition = input.role === "trader"
    ? and(eq(importMappings.id, input.mappingId), eq(importMappings.organizationId, input.organizationId), eq(importMappings.createdBy, input.userId))
    : and(eq(importMappings.id, input.mappingId), eq(importMappings.organizationId, input.organizationId));
  return (await db.select().from(importMappings).where(condition).limit(1))[0];
}

export async function listImportMappingsForUser(input: { userId: number; role: "trader" | "reviewer"; organizationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const condition = input.role === "trader"
    ? and(eq(importMappings.organizationId, input.organizationId), eq(importMappings.createdBy, input.userId))
    : eq(importMappings.organizationId, input.organizationId);
  return db.select().from(importMappings).where(condition).orderBy(desc(importMappings.createdAt));
}

export async function connectIntegration(input: { organizationId: number; providerType: "email" | "storage" | "erp" | "carrier" | "visibility" | "ebl" | "compliance" | "payment" | "finance" | "identity"; providerName: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(integrations).where(and(eq(integrations.organizationId, input.organizationId), eq(integrations.providerType, input.providerType))).limit(1);
  if (current[0]) {
    await db.update(integrations).set({ status: "connected", healthMessage: "Mock adapter ready for operator-run demonstration.", lastSyncedAt: new Date() }).where(eq(integrations.id, current[0].id));
    return current[0].id;
  }
  const result = await db.insert(integrations).values({ ...input, status: "connected", configuration: { mode: "mock_adapter" }, healthMessage: "Mock adapter ready for operator-run demonstration.", lastSyncedAt: new Date() });
  return Number(result[0].insertId);
}

export async function openWorkflowAlert(input: { organizationId: number; integrationId?: number; integrationRunId?: number; alertType?: "source_failure" | "source_health" | "obligation_sla"; severity?: "critical" | "warning" | "information"; title: string; detail: string; dedupeKey?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const policy = input.alertType ? (await db.select().from(workflowAlertPolicies).where(and(eq(workflowAlertPolicies.organizationId, input.organizationId), eq(workflowAlertPolicies.alertType, input.alertType))).limit(1))[0] : undefined;
  if (policy && policy.enabled !== 1) return 0;
  const effectiveSeverity = policy?.severity ?? input.severity ?? "warning";
  const existing = input.dedupeKey ? (await db.select().from(workflowAlerts).where(and(eq(workflowAlerts.organizationId, input.organizationId), eq(workflowAlerts.dedupeKey, input.dedupeKey))).limit(1))[0] : undefined;
  if (existing) {
    await db.update(workflowAlerts).set({ detail: input.detail, severity: effectiveSeverity, integrationId: input.integrationId ?? existing.integrationId, integrationRunId: input.integrationRunId ?? existing.integrationRunId, occurrenceCount: existing.occurrenceCount + 1, lastSeenAt: new Date(), status: existing.status === "resolved" ? "open" : existing.status, resolvedAt: null }).where(eq(workflowAlerts.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(workflowAlerts).values({ ...input, severity: effectiveSeverity, status: "open" });
  return Number(result[0].insertId);
}

export async function recordIntegrationRun(input: { organizationId: number; integrationId: number; runType: string; status: "completed" | "failed" | "skipped"; inputSummary?: unknown; outputSummary?: unknown; errorMessage?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(integrationRuns).values({ integrationId: input.integrationId, runType: input.runType, status: input.status, inputSummary: input.inputSummary, outputSummary: input.outputSummary, errorMessage: input.errorMessage, startedAt: new Date(), completedAt: new Date() });
  const runId = Number(result[0].insertId);
  await db.insert(integrationRunAttempts).values({ integrationRunId: runId, attempt: 1, status: input.status, errorMessage: input.errorMessage, detail: { input: input.inputSummary, output: input.outputSummary }, completedAt: new Date() });
  await db.update(integrations).set({ lastSyncedAt: new Date(), healthMessage: input.status === "completed" ? "Latest normalized signal processed successfully." : input.errorMessage ?? "Adapter requires attention.", status: input.status === "completed" ? "connected" : "degraded" }).where(eq(integrations.id, input.integrationId));
  if (input.status === "failed") await openWorkflowAlert({ organizationId: input.organizationId, integrationId: input.integrationId, integrationRunId: runId, alertType: "source_failure", severity: "warning", title: "Provider run failed", detail: input.errorMessage ?? "The source adapter failed and is available for operator replay.", dedupeKey: `integration-${input.integrationId}-failed` });
  return runId;
}

export async function createSourceIngestionReceipt(input: { organizationId: number; tradeId?: number; integrationId?: number; sourceType: "email_attachment" | "structured_file" | "webhook"; fileName?: string; fileKey?: string; fileUrl?: string; mimeType?: string; payloadHash?: string; rawPayload?: unknown; normalizedStatus?: "queued" | "normalized" | "failed" | "replayed"; routingStatus?: "pending" | "routed" | "dismissed"; routingContext?: unknown; errorMessage?: string; createdBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const routingStatus = input.routingStatus ?? (input.tradeId ? "routed" : "pending");
  const result = await db.insert(sourceIngestionReceipts).values({ ...input, routingStatus, routedAt: routingStatus === "routed" ? new Date() : undefined, routedBy: routingStatus === "routed" ? input.createdBy : undefined, normalizedStatus: input.normalizedStatus ?? "queued", normalizedAt: input.normalizedStatus === "normalized" ? new Date() : undefined });
  return Number(result[0].insertId);
}

export async function getSourceIngestionReceiptById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return (await db.select().from(sourceIngestionReceipts).where(eq(sourceIngestionReceipts.id, id)).limit(1))[0];
}

export async function routeSourceIngestionReceipt(input: { receiptId: number; tradeId: number; routedBy: number; routingContext: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(sourceIngestionReceipts).set({ tradeId: input.tradeId, routingStatus: "routed", routingContext: input.routingContext, routedAt: new Date(), routedBy: input.routedBy }).where(and(eq(sourceIngestionReceipts.id, input.receiptId), eq(sourceIngestionReceipts.routingStatus, "pending")));
  return Number(result[0].affectedRows ?? 0);
}

export async function getHistoricalShadowAuditReview(input: { organizationId: number; from: Date; to: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const tradeRows = await db.select().from(trades).where(sql`${trades.organizationId} = ${input.organizationId} and ${trades.createdAt} >= ${input.from} and ${trades.createdAt} <= ${input.to}`).orderBy(desc(trades.createdAt));
  const tradeIds = tradeRows.map(item => item.id);
  const [documents, fields, exceptions, obligations, events, receipts, pendingUnlinked] = await Promise.all([
    tradeIds.length ? db.select().from(tradeDocuments).where(sql`${tradeDocuments.tradeId} in (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`) : Promise.resolve([]),
    tradeIds.length ? db.select().from(evidenceFields).where(sql`${evidenceFields.tradeId} in (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`) : Promise.resolve([]),
    tradeIds.length ? db.select().from(tradeExceptions).where(sql`${tradeExceptions.tradeId} in (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`) : Promise.resolve([]),
    tradeIds.length ? db.select().from(tradeObligations).where(sql`${tradeObligations.tradeId} in (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`) : Promise.resolve([]),
    tradeIds.length ? db.select().from(tradeEvents).where(sql`${tradeEvents.tradeId} in (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`) : Promise.resolve([]),
    tradeIds.length ? db.select().from(sourceIngestionReceipts).where(sql`${sourceIngestionReceipts.tradeId} in (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`) : Promise.resolve([]),
    db.select().from(sourceIngestionReceipts).where(sql`${sourceIngestionReceipts.organizationId} = ${input.organizationId} and ${sourceIngestionReceipts.routingStatus} = 'pending' and ${sourceIngestionReceipts.receivedAt} >= ${input.from} and ${sourceIngestionReceipts.receivedAt} <= ${input.to}`),
  ]);
  return buildHistoricalShadowReview({ from: input.from, to: input.to, pendingUnlinkedReceipts: pendingUnlinked.length, trades: tradeRows.map(trade => ({ id: trade.id, reference: trade.reference, buyerName: trade.buyerName, sellerName: trade.sellerName, totalValue: trade.totalValue, currency: trade.currency, createdAt: trade.createdAt, documentCount: documents.filter(item => item.tradeId === trade.id).length, evidenceFieldCount: fields.filter(item => item.tradeId === trade.id).length, exceptionCount: exceptions.filter(item => item.tradeId === trade.id).length, criticalExceptionCount: exceptions.filter(item => item.tradeId === trade.id && item.severity === "critical" && item.status === "open").length, openCriticalObligationCount: obligations.filter(item => item.tradeId === trade.id && item.criticality === "critical" && item.status !== "fulfilled").length, sourceReceiptCount: receipts.filter(item => item.tradeId === trade.id).length, shadowEventCount: events.filter(item => item.tradeId === trade.id && item.source === "shadow_audit").length })) });
}

export async function createConfirmedEvidenceField(input: { tradeId: number; fieldName: string; fieldValue: string; sourceLocation: unknown; confirmedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(evidenceFields).values({ tradeId: input.tradeId, fieldName: input.fieldName, fieldValue: input.fieldValue, authority: "authoritative", confidence: "1.0000", sourceLocation: input.sourceLocation, modelVersion: "structured-file-mapping", extractedAt: new Date(), confirmedBy: input.confirmedBy, confirmedAt: new Date() });
  return Number(result[0].insertId);
}

export async function replaySourceIngestionReceipt(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(sourceIngestionReceipts).set({ normalizedStatus: "replayed", replayCount: sql`${sourceIngestionReceipts.replayCount} + 1`, errorMessage: null, normalizedAt: new Date() }).where(eq(sourceIngestionReceipts.id, id));
}

export async function updateWorkflowAlert(input: { id: number; status: "acknowledged" | "resolved"; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(workflowAlerts).set({ status: input.status, acknowledgedBy: input.actorId, acknowledgedAt: input.status === "acknowledged" ? new Date() : undefined, resolvedAt: input.status === "resolved" ? new Date() : undefined }).where(eq(workflowAlerts.id, input.id));
}

export async function getWorkflowAlertPolicies(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(workflowAlertPolicies).where(eq(workflowAlertPolicies.organizationId, organizationId)).orderBy(workflowAlertPolicies.alertType);
}

export async function upsertWorkflowAlertPolicy(input: { organizationId: number; alertType: "source_failure" | "source_health" | "obligation_sla"; enabled: boolean; severity: "critical" | "warning" | "information"; threshold: number; updatedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(workflowAlertPolicies).values({ ...input, enabled: input.enabled ? 1 : 0 }).onDuplicateKeyUpdate({ set: { enabled: input.enabled ? 1 : 0, severity: input.severity, threshold: input.threshold, updatedBy: input.updatedBy, updatedAt: new Date() } });
}

export async function registerOperationalSchedule(input: { scheduleKey: string; taskUid: string; cronExpression: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(operationalSchedules).values({ ...input, enabled: 1 }).onDuplicateKeyUpdate({ set: { taskUid: input.taskUid, cronExpression: input.cronExpression, enabled: 1, updatedAt: new Date() } });
}

export async function getOperationalSchedule(scheduleKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return (await db.select().from(operationalSchedules).where(eq(operationalSchedules.scheduleKey, scheduleKey)).limit(1))[0] ?? null;
}

export async function getOperationalScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return (await db.select().from(operationalSchedules).where(eq(operationalSchedules.taskUid, taskUid)).limit(1))[0] ?? null;
}

export async function recordOperationalScheduleExecution(input: { taskUid: string; result?: unknown; error?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(operationalSchedules).set({ lastExecutedAt: new Date(), lastResult: input.result, lastError: input.error ?? null }).where(eq(operationalSchedules.taskUid, input.taskUid));
}

export async function runObligationEscalationSweep() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  const candidates = await db.select().from(tradeObligations).where(sql`${tradeObligations.deadline} is not null and ${tradeObligations.deadline} < ${now} and ${tradeObligations.status} != 'fulfilled'`);
  if (!candidates.length) return { evaluated: 0, escalated: 0 };
  const ids = candidates.map(item => item.id);
  const history = await db.select().from(obligationEscalations).where(sql`${obligationEscalations.obligationId} in (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(obligationEscalations.escalatedAt));
  const tradeIds = candidates.map(item => item.tradeId); const relatedTrades = tradeIds.length ? await db.select().from(trades).where(sql`${trades.id} in (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`) : []; const organizationIds = relatedTrades.map(trade => trade.organizationId).filter((id): id is number => id !== null); const policies = organizationIds.length ? await db.select().from(workflowAlertPolicies).where(sql`${workflowAlertPolicies.organizationId} in (${sql.join(organizationIds.map(id => sql`${id}`), sql`, `)})`) : []; const tradeById = new Map(relatedTrades.map(trade => [trade.id, trade]));
  let escalated = 0;
  for (const obligation of candidates) {
    const latest = history.find(record => record.obligationId === obligation.id);
    const trade = tradeById.get(obligation.tradeId); const policy = trade?.organizationId ? policies.find(item => item.organizationId === trade.organizationId && item.alertType === "obligation_sla") : undefined; const cadenceHours = policy?.threshold ?? 24;
    if (latest && now.getTime() - latest.escalatedAt.getTime() < cadenceHours * 60 * 60 * 1000) continue;
    const level = history.filter(record => record.obligationId === obligation.id).length + 1;
    const reason = `SLA sweep: deadline ${obligation.deadline?.toISOString()} remains unmet.`;
    await db.insert(obligationEscalations).values({ obligationId: obligation.id, level, reason });
    await db.update(tradeObligations).set({ status: "overdue" }).where(eq(tradeObligations.id, obligation.id));
    await db.insert(tradeEvents).values({ tradeId: obligation.tradeId, eventType: "obligation.sla_escalated", title: "Obligation escalated by SLA sweep", detail: `${obligation.action}. ${reason}`, source: "scheduled_sla" });
    if (trade?.organizationId) await openWorkflowAlert({ organizationId: trade.organizationId, alertType: "obligation_sla", severity: "warning", title: "Obligation SLA escalation", detail: `${obligation.action} remains overdue for trade ${trade.reference}.`, dedupeKey: `obligation-sla-${obligation.id}` });
    escalated += 1;
  }
  return { evaluated: candidates.length, escalated };
}

export async function runSourceHealthSweep() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  const [allIntegrations, policies] = await Promise.all([db.select().from(integrations), db.select().from(workflowAlertPolicies)]);
  const rows = allIntegrations.filter(integration => shouldEscalateSourceHealth({ policy: policies.find(item => item.organizationId === integration.organizationId && item.alertType === "source_health"), status: integration.status, lastSyncedAt: integration.lastSyncedAt, now }));
  let alerted = 0;
  for (const integration of rows) {
    const policy = policies.find(item => item.organizationId === integration.organizationId && item.alertType === "source_health"); const staleAt = new Date(now.getTime() - (policy?.threshold ?? 24) * 60 * 60 * 1000);
    await openWorkflowAlert({ organizationId: integration.organizationId, integrationId: integration.id, alertType: "source_health", severity: integration.status === "degraded" ? "critical" : "warning", title: integration.status === "degraded" ? "Provider health is degraded" : "Provider health is stale", detail: integration.healthMessage || `No successful normalized signal has been recorded since ${staleAt.toISOString()}.`, dedupeKey: `source-health-${integration.id}` });
    alerted += 1;
  }
  return { evaluated: rows.length, alerted };
}

export async function recordExternalReference(input: { organizationId: number; tradeId?: number; entityType: string; providerName: string; externalId: string; payload: unknown; observedAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(externalReferences).values(input).onDuplicateKeyUpdate({ set: { payload: input.payload, observedAt: input.observedAt, recordedAt: new Date() } });
}

export async function createImportMapping(input: { organizationId: number; sourceName: string; entityType: string; mapping: unknown; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(importMappings).values(input);
  return Number(result[0].insertId);
}

export async function appendAuditRecord(input: { organizationId: number; actorId?: number; action: string; objectType: string; objectId: string; beforeState?: unknown; afterState?: unknown; reason?: string; source?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(auditRecords).values({ ...input, source: input.source ?? "application" });
}

export async function getGovernanceData(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [controls, audits, guests, membershipRows] = await Promise.all([
    db.select().from(organizationControls).where(eq(organizationControls.organizationId, organizationId)).limit(1),
    db.select().from(auditRecords).where(eq(auditRecords.organizationId, organizationId)).orderBy(desc(auditRecords.createdAt)).limit(80),
    db.select().from(guestAccessGrants).where(eq(guestAccessGrants.organizationId, organizationId)).orderBy(desc(guestAccessGrants.createdAt)),
    db.select().from(memberships).where(eq(memberships.organizationId, organizationId)),
  ]);
  const membershipIds = membershipRows.map(row => row.id);
  const [grants, memberProfiles, sourceConfigurations] = await Promise.all([
    membershipIds.length ? db.select().from(capabilityGrants).where(sql`${capabilityGrants.membershipId} in (${sql.join(membershipIds.map(id => sql`${id}`), sql`, `)})`) : [],
    membershipRows.length ? db.select().from(users).where(sql`${users.id} in (${sql.join(membershipRows.map(row => sql`${row.userId}`), sql`, `)})`) : [],
    db.select().from(integrations).where(eq(integrations.organizationId, organizationId)).orderBy(desc(integrations.updatedAt)),
  ]);
  return { controls: controls[0] ?? null, audits, guests, memberships: membershipRows, memberProfiles, grants, sourceConfigurations };
}

export async function addOrganizationMembership(input: { organizationId: number; email: string; role: "trader" | "reviewer" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
  if (!user) return null;
  const existing = (await db.select().from(memberships).where(and(eq(memberships.organizationId, input.organizationId), eq(memberships.userId, user.id))).limit(1))[0];
  if (existing) await db.update(memberships).set({ role: input.role }).where(eq(memberships.id, existing.id));
  else await db.insert(memberships).values({ organizationId: input.organizationId, userId: user.id, role: input.role });
  await db.update(users).set({ organizationId: input.organizationId, role: input.role }).where(eq(users.id, user.id));
  return (await db.select().from(memberships).where(and(eq(memberships.organizationId, input.organizationId), eq(memberships.userId, user.id))).limit(1))[0];
}

export async function updateOrganizationMembershipRole(input: { membershipId: number; organizationId: number; role: "trader" | "reviewer" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = (await db.select().from(memberships).where(and(eq(memberships.id, input.membershipId), eq(memberships.organizationId, input.organizationId))).limit(1))[0];
  if (!membership) return null;
  await db.update(memberships).set({ role: input.role }).where(eq(memberships.id, membership.id));
  await db.update(users).set({ role: input.role }).where(eq(users.id, membership.userId));
  return membership;
}

export async function removeOrganizationMembership(input: { membershipId: number; organizationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = (await db.select().from(memberships).where(and(eq(memberships.id, input.membershipId), eq(memberships.organizationId, input.organizationId))).limit(1))[0];
  if (!membership) return null;
  await db.delete(capabilityGrants).where(eq(capabilityGrants.membershipId, membership.id));
  await db.delete(memberships).where(eq(memberships.id, membership.id));
  await db.update(users).set({ organizationId: null }).where(eq(users.id, membership.userId));
  return membership;
}

export async function addCapabilityGrant(input: { membershipId: number; capability: string; grantedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(capabilityGrants).values(input).onDuplicateKeyUpdate({ set: { grantedBy: input.grantedBy } });
}

export async function removeCapabilityGrant(input: { membershipId: number; capability: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(capabilityGrants).where(and(eq(capabilityGrants.membershipId, input.membershipId), eq(capabilityGrants.capability, input.capability)));
}

export async function updateIntegrationSourceConfiguration(input: { organizationId: number; integrationId: number; configuration: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const integration = (await db.select().from(integrations).where(and(eq(integrations.id, input.integrationId), eq(integrations.organizationId, input.organizationId))).limit(1))[0];
  if (!integration) return null;
  await db.update(integrations).set({ configuration: input.configuration, updatedAt: new Date() }).where(eq(integrations.id, integration.id));
  return integration;
}

export async function getAuditExport(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(auditRecords).where(eq(auditRecords.organizationId, organizationId)).orderBy(desc(auditRecords.createdAt)).limit(500);
}

export async function updateOrganizationControls(input: { organizationId: number; dataRetentionDays: number; allowedAiProviders?: unknown; regionalProcessing?: string; piiRedaction: "off" | "on_upload" | "on_model_request"; publicModelTraining: "disallowed" | "allowed"; requireMfa: "disabled" | "required" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select({ id: organizationControls.id }).from(organizationControls).where(eq(organizationControls.organizationId, input.organizationId)).limit(1);
  if (current[0]) await db.update(organizationControls).set(input).where(eq(organizationControls.id, current[0].id));
  else await db.insert(organizationControls).values(input);
}

export async function createGuestGrant(input: { organizationId: number; tradeId: number; recipientEmail: string; tokenHash: string; scope: unknown; expiresAt: Date; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(guestAccessGrants).values(input);
  return Number(result[0].insertId);
}

export async function getGuestGrantByTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(guestAccessGrants).where(eq(guestAccessGrants.tokenHash, tokenHash)).limit(1);
  return rows[0];
}

export async function touchGuestGrant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(guestAccessGrants).set({ accessedAt: new Date() }).where(eq(guestAccessGrants.id, id));
}

export async function recordGuestHandoff(input: { grantId: number; tradeId: number; summary: string; ingestedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(tradeMessages).values({ tradeId: input.tradeId, sender: "Scoped partner portal", subject: "Partner evidence handoff", body: input.summary, source: "partner_portal", ingestedBy: input.ingestedBy, receivedAt: new Date() });
  await db.update(guestAccessGrants).set({ status: "completed", accessedAt: new Date() }).where(eq(guestAccessGrants.id, input.grantId));
}

export async function recordGuestCargoReadyDate(input: { tradeId: number; cargoReadyDate: Date; ingestedBy: number; summary: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(trades).set({ expectedShipmentDate: input.cargoReadyDate }).where(eq(trades.id, input.tradeId));
  await db.insert(tradeMessages).values({ tradeId: input.tradeId, sender: "Scoped partner portal", subject: "Cargo-ready date supplied", body: input.summary, source: "partner_portal", ingestedBy: input.ingestedBy, receivedAt: new Date() });
}

export async function recordGuestPackingListReference(input: { tradeId: number; reference: string; ingestedBy: number; summary: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(tradeMessages).values({ tradeId: input.tradeId, sender: "Scoped partner portal", subject: "Packing-list reference supplied", body: `${input.summary}\nReference: ${input.reference}`, source: "partner_portal", ingestedBy: input.ingestedBy, receivedAt: new Date() });
}

export async function revokeGuestGrant(id: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(guestAccessGrants).set({ status: "revoked" }).where(and(eq(guestAccessGrants.id, id), eq(guestAccessGrants.organizationId, organizationId)));
}

export async function getGuestGrantForOwner(input: { id: number; organizationId: number; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return (await db.select().from(guestAccessGrants).where(and(eq(guestAccessGrants.id, input.id), eq(guestAccessGrants.organizationId, input.organizationId), eq(guestAccessGrants.createdBy, input.createdBy))).limit(1))[0];
}

function workspaceCondition(user: { id: number; role: "trader" | "reviewer"; organizationId?: number | null }) {
  if (user.role === "trader") return user.organizationId ? and(eq(trades.ownerId, user.id), eq(trades.organizationId, user.organizationId)) : eq(trades.ownerId, user.id);
  return user.organizationId ? eq(trades.organizationId, user.organizationId) : undefined;
}

export async function listTradesForUser(user: { id: number; role: "trader" | "reviewer"; organizationId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(trades).where(workspaceCondition(user)).orderBy(desc(trades.updatedAt));
  const ids = rows.map(row => row.id);
  if (!ids.length) return [];
  const docs = await db.select({ tradeId: tradeDocuments.tradeId, status: tradeDocuments.status }).from(tradeDocuments).where(sql`${tradeDocuments.tradeId} in (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
  const shipmentRows = await db.select({ tradeId: shipmentAllocations.tradeId, bookingReference: shipments.bookingReference, containerReferences: shipments.containerReferences }).from(shipmentAllocations).innerJoin(shipments, eq(shipmentAllocations.shipmentId, shipments.id)).where(sql`${shipmentAllocations.tradeId} in (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
  return rows.map(trade => ({ ...trade, documentSummary: docs.filter(document => document.tradeId === trade.id), shipmentReferences: shipmentRows.filter(shipment => shipment.tradeId === trade.id).flatMap(shipment => [shipment.bookingReference, ...(Array.isArray(shipment.containerReferences) ? shipment.containerReferences.filter((item): item is string => typeof item === "string") : [])].filter((item): item is string => Boolean(item))) }));
}

export async function listProductConcentrationForOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(tradeLines).innerJoin(trades, eq(tradeLines.tradeId, trades.id)).leftJoin(products, eq(tradeLines.productId, products.id)).where(eq(trades.organizationId, organizationId));
  return rows.map(row => ({ line: row.tradeLines, trade: row.trades, product: row.products }));
}

export async function getDashboardData(user: { id: number; role: "trader" | "reviewer"; organizationId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const condition = workspaceCondition(user);
  const [tradeRows, activity, exceptionRows] = await Promise.all([
    db.select().from(trades).where(condition).orderBy(desc(trades.updatedAt)),
    db.select().from(tradeEvents).innerJoin(trades, eq(tradeEvents.tradeId, trades.id)).where(condition).orderBy(desc(tradeEvents.createdAt)).limit(8),
    db.select().from(tradeExceptions).innerJoin(trades, eq(tradeExceptions.tradeId, trades.id)).where(condition),
  ]);
  const activeTrades = tradeRows.filter(trade => !["approved", "rejected"].includes(trade.assuranceState));
  const valueAtRisk = activeTrades.reduce((sum, trade) => sum + Number(trade.totalValue), 0);
  const verification = {
    approved: tradeRows.filter(trade => trade.assuranceState === "approved").length,
    underReview: tradeRows.filter(trade => trade.assuranceState === "under_review" || trade.assuranceState === "submitted").length,
    blocked: tradeRows.filter(trade => trade.trustBand === "critical" || trade.assuranceState === "rejected").length,
  };
  const exceptionVolume = exceptionRows.filter(row => row.tradeExceptions.status === "open").length;
  const verificationThroughput = tradeRows.filter(trade => trade.assuranceState === "approved" || trade.assuranceState === "rejected").length;
  return { activeTrades: activeTrades.length, valueAtRisk, verification, exceptionVolume, verificationThroughput, activity, trades: tradeRows.slice(0, 6) };
}

export async function getEvidenceVault(user: { id: number; role: "trader" | "reviewer"; organizationId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(tradeDocuments).innerJoin(trades, eq(tradeDocuments.tradeId, trades.id)).where(workspaceCondition(user)).orderBy(desc(tradeDocuments.updatedAt));
  const versions = await db.select().from(tradeDocumentVersions);
  return rows.map(row => ({ document: row.tradeDocuments, trade: row.trades, versions: versions.filter(version => version.documentId === row.tradeDocuments.id) }));
}

export async function updateDocumentUpload(input: {
  documentId: number;
  userId: number;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  extractedData: Record<string, unknown>;
  inconsistencies: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await getDocumentById(input.documentId);
  if (current?.fileKey && current.fileUrl && current.fileName && current.mimeType) {
    const versions = await db.select({ id: tradeDocumentVersions.id }).from(tradeDocumentVersions).where(eq(tradeDocumentVersions.documentId, input.documentId));
    await db.insert(tradeDocumentVersions).values({
      documentId: current.id, tradeId: current.tradeId, version: versions.length + 1, fileName: current.fileName, fileKey: current.fileKey,
      fileUrl: current.fileUrl, mimeType: current.mimeType, extractedData: current.extractedData, inconsistencies: current.inconsistencies,
      source: "user_upload", supersededBy: input.userId,
    });
  }
  await db.update(tradeDocuments).set({
    status: "uploaded", fileName: input.fileName, fileKey: input.fileKey, fileUrl: input.fileUrl, mimeType: input.mimeType,
    extractedData: input.extractedData, inconsistencies: input.inconsistencies, uploadedBy: input.userId, uploadedAt: new Date(),
  }).where(eq(tradeDocuments.id, input.documentId));
  const snapshots = await db.select({ id: tradeDocumentVersions.id }).from(tradeDocumentVersions).where(eq(tradeDocumentVersions.documentId, input.documentId));
  await db.insert(tradeDocumentVersions).values({
    documentId: input.documentId, tradeId: current?.tradeId ?? 0, version: snapshots.length + 1, fileName: input.fileName,
    fileKey: input.fileKey, fileUrl: input.fileUrl, mimeType: input.mimeType, extractedData: input.extractedData,
    inconsistencies: input.inconsistencies, source: "user_upload", supersededBy: input.userId,
  });
}

export async function updateDocumentReview(input: { documentId: number; reviewerId: number; status: "under review" | "verified" | "rejected"; reviewerNotes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(tradeDocuments).set({ status: input.status, reviewedBy: input.reviewerId, reviewedAt: new Date(), reviewerNotes: input.reviewerNotes ?? null }).where(eq(tradeDocuments.id, input.documentId));
}

export async function correctDocumentExtraction(input: { documentId: number; reviewerId: number; extractedData: Record<string, unknown>; reviewerNotes: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(tradeDocuments).set({ extractedData: input.extractedData, reviewedBy: input.reviewerId, reviewedAt: new Date(), reviewerNotes: input.reviewerNotes }).where(eq(tradeDocuments.id, input.documentId));
}

export async function updateTradeAssurance(input: { tradeId: number; assuranceState: "submitted" | "under_review" | "approved" | "rejected"; actorId: number; reason?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(trades).set({
    assuranceState: input.assuranceState,
    commercialState: input.assuranceState === "submitted" ? "confirmed" : undefined,
    submittedAt: input.assuranceState === "submitted" ? new Date() : undefined,
    resolvedAt: ["approved", "rejected"].includes(input.assuranceState) ? new Date() : undefined,
  }).where(eq(trades.id, input.tradeId));
}

export async function refreshTradeTrustScore(tradeId: number, score: number, band: "critical" | "guarded" | "review" | "ready") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(trades).set({ trustScore: score, trustBand: band }).where(eq(trades.id, tradeId));
}

export async function getDocumentById(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(tradeDocuments).where(eq(tradeDocuments.id, documentId)).limit(1);
  return rows[0];
}

export async function getTradeDocuments(tradeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(tradeDocuments).where(eq(tradeDocuments.tradeId, tradeId));
}

export async function createInconsistencyExceptions(input: { tradeId: number; documentId: number; issues: string[] }) {
  if (!input.issues.length) return;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(tradeExceptions).values(input.issues.map(detail => ({
    tradeId: input.tradeId, documentId: input.documentId, category: "documentation" as const, severity: "warning" as const,
    title: "Cross-document inconsistency", detail,
  })));
}

export async function resolveTradeException(input: { exceptionId: number; reviewerId: number; outcome: "corrected" | "accepted_with_waiver" | "rejected_source" | "duplicate" | "not_actionable"; rationale: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(tradeExceptions).set({ status: "resolved", resolutionOutcome: input.outcome, resolutionRationale: input.rationale, resolvedBy: input.reviewerId, resolvedAt: new Date() }).where(eq(tradeExceptions.id, input.exceptionId));
}

export async function fulfillTradeObligation(input: { obligationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(tradeObligations).set({ status: "fulfilled" }).where(eq(tradeObligations.id, input.obligationId));
}

export async function getExceptionById(exceptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(tradeExceptions).where(eq(tradeExceptions.id, exceptionId)).limit(1);
  return rows[0];
}

export async function listOrganizationExceptionsForAlertQuality(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ exception: tradeExceptions }).from(tradeExceptions).innerJoin(trades, eq(tradeExceptions.tradeId, trades.id)).where(eq(trades.organizationId, organizationId));
  return rows.map(row => row.exception);
}

export async function getObligationById(obligationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(tradeObligations).where(eq(tradeObligations.id, obligationId)).limit(1);
  return rows[0];
}

export async function createPartnerRequest(input: { tradeId: number; requestedBy: number; recipientEmail: string; requestType: string; message: string; scope?: unknown; dueAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(partnerRequests).values({ ...input, status: "sent" });
  return Number(result[0].insertId);
}

export async function listPartnerRequestsForUser(user: { id: number; role: "trader" | "reviewer"; organizationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const condition = user.role === "trader"
    ? and(eq(trades.organizationId, user.organizationId), eq(trades.ownerId, user.id))
    : eq(trades.organizationId, user.organizationId);
  const rows = await db.select().from(partnerRequests).innerJoin(trades, eq(partnerRequests.tradeId, trades.id)).where(condition).orderBy(desc(partnerRequests.createdAt));
  return rows.map(row => ({ request: row.partnerRequests, trade: row.trades }));
}

export async function getPartnerRequestById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return (await db.select().from(partnerRequests).where(eq(partnerRequests.id, id)).limit(1))[0];
}

export async function listPartnerRequestsForGuest(tradeId: number, recipientEmail: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(partnerRequests).where(and(eq(partnerRequests.tradeId, tradeId), eq(partnerRequests.recipientEmail, recipientEmail))).orderBy(desc(partnerRequests.createdAt));
}

export async function respondToPartnerRequest(input: { requestId: number; responseSummary: string; responseEvidence?: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(partnerRequests).set({ status: "responded", responseSummary: input.responseSummary, responseEvidence: input.responseEvidence, respondedAt: new Date() }).where(eq(partnerRequests.id, input.requestId));
}

export async function updatePartnerRequestStatus(input: { requestId: number; status: "viewed" | "accepted" | "completed" | "overdue" | "cancelled" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(partnerRequests).set({ status: input.status, completedAt: input.status === "completed" ? new Date() : undefined }).where(eq(partnerRequests.id, input.requestId));
}

export async function remindPartnerRequest(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(partnerRequests).set({ lastReminderAt: new Date() }).where(eq(partnerRequests.id, requestId));
}

export async function ingestTradeEmail(input: { tradeId: number; sender: string; subject: string; body: string; ingestedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(tradeMessages).values({ ...input, source: "email", receivedAt: new Date() });
}

export async function createShadowAuditTrade(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [owner] = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
  const now = new Date();
  const shipmentDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 12);
  const reference = `AR-SHADOW-${Date.now().toString().slice(-6)}`;
  const result = await db.insert(trades).values({
    ownerId, organizationId: owner?.organizationId ?? null, reference, buyerName: "Northstar Foods GmbH", buyerCountry: "DE", sellerName: "Meridian Export House LLC", sellerCountry: "AE",
    commodity: "Grade 1 Arabica coffee beans", quantity: "24000.000", unit: "kg", unitPrice: "4.250", totalValue: "102000.00", currency: "USD", incoterm: "FOB",
    originCountry: "BR", destinationCountry: "DE", expectedShipmentDate: shipmentDate, commercialState: "confirmed", executionState: "blocked", documentState: "in_progress", logisticsState: "planned", settlementState: "unconfirmed", assuranceState: "submitted", partyKycState: "pending", trustScore: 45, trustBand: "guarded", submittedAt: now,
  });
  const tradeId = Number(result[0].insertId);
  await db.insert(tradeDocuments).values([
    { tradeId, documentType: "commercial invoice", status: "uploaded", fileName: "INV-MEH-3481-v2.pdf", mimeType: "application/pdf", uploadedBy: ownerId, uploadedAt: now, extractedData: { invoiceNumber: "MEH-3481", issueDate: "2026-08-20", currency: "USD", totalAmount: "102000.00", sellerName: "Meridian Export House LLC", buyerName: "Northstar Foods GmbH", quantity: "24000", unit: "kg", incoterm: "CIF", originCountry: "BR", destinationCountry: "DE", transportReference: "", confidence: 0.96, issues: ["Incoterm differs from Trade Twin."] }, inconsistencies: ["incoterm conflicts with another uploaded document."] },
    { tradeId, documentType: "packing list", status: "uploaded", fileName: "PL-MEH-3481-final.pdf", mimeType: "application/pdf", uploadedBy: ownerId, uploadedAt: now, extractedData: { invoiceNumber: "MEH-3481", issueDate: "2026-08-20", currency: "USD", totalAmount: "", sellerName: "Meridian Export House LLC", buyerName: "Northstar Foods GmbH", quantity: "23800", unit: "kg", incoterm: "FOB", originCountry: "BR", destinationCountry: "DE", transportReference: "", confidence: 0.93, issues: ["Quantity differs from commercial invoice."] }, inconsistencies: ["quantity conflicts with another uploaded document."] },
    { tradeId, documentType: "bill of lading", status: "pending" },
    { tradeId, documentType: "certificate of origin", status: "pending" },
    { tradeId, documentType: "inspection certificate", status: "under review", fileName: "Inspector-report-2026-08-18.pdf", mimeType: "application/pdf", uploadedBy: ownerId, uploadedAt: now, extractedData: { invoiceNumber: "", issueDate: "2026-08-18", currency: "", totalAmount: "", sellerName: "Meridian Export House LLC", buyerName: "", quantity: "23800", unit: "kg", incoterm: "", originCountry: "BR", destinationCountry: "", transportReference: "", confidence: 0.86, issues: [] }, inconsistencies: [] },
    { tradeId, documentType: "LC/payment terms", status: "uploaded", fileName: "LC-07191-amended.pdf", mimeType: "application/pdf", uploadedBy: ownerId, uploadedAt: now, extractedData: { invoiceNumber: "", issueDate: "", currency: "USD", totalAmount: "102000.00", sellerName: "", buyerName: "Northstar Foods GmbH", quantity: "", unit: "", incoterm: "FOB", originCountry: "", destinationCountry: "", transportReference: "", confidence: 0.88, issues: ["Presentation deadline requires shipping date confirmation."] }, inconsistencies: [] },
  ]);
  const documents = await getTradeDocuments(tradeId);
  const invoiceId = documents.find(document => document.documentType === "commercial invoice")?.id;
  const packingId = documents.find(document => document.documentType === "packing list")?.id;
  await db.insert(tradeExceptions).values([
    { tradeId, documentId: invoiceId, category: "documentation", severity: "warning", title: "Incoterm contradiction", detail: "The issued commercial invoice states CIF while the Trade Twin and LC payment terms state FOB." },
    { tradeId, documentId: packingId, category: "commercial", severity: "critical", title: "Quantity discrepancy", detail: "The packing list shows 23,800 kg but the agreed quantity and invoice show 24,000 kg." },
  ]);
  await db.insert(tradeObligations).values([
    { tradeId, actor: "Factory coordinator", action: "Confirm revised cargo-ready date before booking cut-off", evidenceRequirement: "Updated production confirmation", deadline: new Date(Date.now() - 1000 * 60 * 60 * 24), criticality: "critical", status: "overdue", source: "Booking instruction" },
    { tradeId, actor: "Exporter", action: "Provide certificate of origin", evidenceRequirement: "Issued certificate of origin", deadline: shipmentDate, criticality: "warning", status: "open", source: "LC terms" },
  ]);
  await db.insert(tradeEvents).values([
    { tradeId, actorId: ownerId, eventType: "trade.created", title: "Shadow Audit Trade Twin created", detail: "Historical source materials reconstructed into a canonical trade view.", source: "shadow_audit", createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48) },
    { tradeId, actorId: ownerId, eventType: "evidence.received", title: "Invoice and packing list ingested", detail: "ARCWAY extracted key fields and identified source drift.", source: "shadow_audit", createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 36) },
    { tradeId, actorId: ownerId, eventType: "exception.detected", title: "Two cross-source exceptions detected", detail: "Quantity and Incoterm conflicts now block shipment preflight.", source: "shadow_audit", createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24) },
    { tradeId, actorId: ownerId, eventType: "trade.submitted", title: "Trade submitted for assurance", detail: "The Shadow Audit case is ready for a reviewer decision.", source: "shadow_audit", createdAt: now },
  ]);
  return { tradeId, reference };
}

export async function createTradeTask(input: { organizationId: number; tradeId: number; exceptionId?: number; obligationId?: number; title: string; detail: string; assigneeId?: number; deadline?: Date; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(tradeTasks).values(input);
  return Number(result[0].insertId);
}

export async function getTradeTaskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(tradeTasks).where(eq(tradeTasks.id, id)).limit(1);
  return rows[0];
}

export async function updateTradeTaskStatus(input: { id: number; status: "open" | "in_progress" | "completed" | "cancelled" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(tradeTasks).set({ status: input.status, completedAt: input.status === "completed" ? new Date() : null }).where(eq(tradeTasks.id, input.id));
}

export async function createGeneratedDocument(input: { tradeId: number; documentType: string; templateVersion: string; dataSnapshot: unknown; renderedContent: string; contentHash: string; issuedBy?: number; status: "draft" | "issued" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(generatedDocuments).values({ ...input, issuedAt: input.status === "issued" ? new Date() : null });
  return Number(result[0].insertId);
}
