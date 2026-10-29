import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { fileURLToPath } from "node:url";

const engine = vi.hoisted(() => ({ client: undefined as PGlite | undefined }));
// Run the real persistence functions against PostgreSQL, without a network account.
vi.mock("pg", () => ({
  Pool: class {
    on() {
      return this;
    }
  },
}));
vi.mock("drizzle-orm/node-postgres", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  return { drizzle: () => drizzle(engine.client!) };
});
import * as database from "./db";
import { eq } from "drizzle-orm";
import { trades, tradeDocuments, tradeExceptions, operationalSchedules } from "../drizzle/schema";
import { appRouter } from "./routers";
import { DOCUMENT_FIELD_NAMES } from "./documentEvidence";
import { tradeRouter } from "./routers/trades";
import type { TrpcContext } from "./_core/context";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { storageRead } from "./storage";
import { buildComparisonMatrix } from "../shared/comparisonMatrix";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/aiProviders", () => ({ getDocumentProviders: () => ["gemini"] }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ invoiceNumber: "TEST-001", issueDate: "2026-10-17", currency: "USD", totalAmount: "30603.19", unitPrice: "25.50", sellerName: "Seller", buyerName: "Buyer", quantity: "1200.125", unit: "kg", incoterm: "FOB", originCountry: "BD", destinationCountry: "DE", transportReference: "", shipmentDate: "", confidence: 0.97, issues: [] }) } }] })) }));

const migrationsFolder = fileURLToPath(
  new URL("../drizzle/postgresql", import.meta.url)
);

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://localhost/arcway_test");
  engine.client = new PGlite();
  await migrate(drizzle(engine.client), { migrationsFolder });
}, 60_000);
beforeEach(async () => {
  await engine.client!.exec(
    'TRUNCATE "users", "organizations", "operationalSchedules", "appRuntimeState" RESTART IDENTITY CASCADE'
  );
});
afterAll(async () => {
  await engine.client?.close();
  vi.unstubAllEnvs();
});

async function account() {
  await database.upsertUser({
    openId: "reviewer-neon",
    name: "Reviewer",
    role: "reviewer",
  });
  return (await database.getUserByOpenId("reviewer-neon"))!;
}
async function trade(owner: Awaited<ReturnType<typeof account>>) {
  return database.createTrade({
    ownerId: owner.id,
    organizationId: owner.organizationId,
    reference: "AR-PG-001",
    buyerName: "Buyer",
    buyerCountry: "DE",
    sellerName: "Seller",
    sellerCountry: "BD",
    commodity: "Cotton",
    quantity: "1200.125",
    unit: "kg",
    unitPrice: "25.50",
    totalValue: "30603.19",
    currency: "USD",
    incoterm: "FOB",
    originCountry: "BD",
    destinationCountry: "DE",
    expectedShipmentDate: new Date("2026-11-01T12:30:00+06:00"),
  });
}

describe("Neon PostgreSQL migration and persistence", () => {
  it("applies all 48 tables and can rerun the migration safely", async () => {
    await migrate(drizzle(engine.client!), { migrationsFolder });
    const tables = await engine.client!.query(
      "select table_name from information_schema.tables where table_schema = 'public'"
    );
    expect(tables.rows).toHaveLength(48);
    const columns = await engine.client!.query<{
      column_name: string;
      data_type: string;
    }>(
      "select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = 'sourceIngestionReceipts'"
    );
    expect(columns.rows).toContainEqual({
      column_name: "rawPayload",
      data_type: "jsonb",
    });
    expect(columns.rows).toContainEqual({
      column_name: "receivedAt",
      data_type: "timestamp with time zone",
    });
  });
  it("upserts an identity without duplicating its organization or membership", async () => {
    const user = await account();
    await database.upsertUser({
      openId: user.openId,
      name: "Updated Reviewer",
      role: "reviewer",
    });
    expect((await database.getUserByOpenId(user.openId))?.id).toBe(user.id);
    expect((await database.getUserByOpenId(user.openId))?.name).toBe(
      "Updated Reviewer"
    );
    for (const table of ["users", "organizations", "memberships"]) {
      expect(
        (await engine.client!.query(`select * from "${table}"`)).rows
      ).toHaveLength(1);
    }
  });
  it("preserves reviewer privileges and profile fields during a session-only upsert", async () => {
    const owner = await account();
    await database.upsertUser({
      openId: owner.openId,
      lastSignedIn: new Date(),
    });
    const updated = await database.getUserByOpenId(owner.openId);
    expect(updated?.role).toBe("reviewer");
    expect(updated?.name).toBe("Reviewer");
    expect(updated?.organizationId).toBe(owner.organizationId);
  });
  it("creates only one workspace when identity synchronization races", async () => {
    await Promise.all([
      database.upsertUser({ openId: "user_parallel", name: "Parallel" }),
      database.upsertUser({ openId: "user_parallel", name: "Parallel" }),
    ]);
    expect(
      (await engine.client!.query("select * from organizations")).rows
    ).toHaveLength(1);
    expect(
      (await engine.client!.query("select * from memberships")).rows
    ).toHaveLength(1);
  });
  it("returns generated trade IDs and preserves decimals, timestamps, and JSON evidence", async () => {
    const owner = await account();
    const id = await trade(owner);
    expect(id).toBeGreaterThan(0);
    const row = await database.getTradeById(id);
    expect(row?.quantity).toBe("1200.125");
    expect(row?.totalValue).toBe("30603.19");
    expect(row?.expectedShipmentDate.toISOString()).toBe(
      "2026-11-01T06:30:00.000Z"
    );
    await database.createDocumentPlaceholders(id);
    const receiptId = await database.createSourceIngestionReceipt({
      organizationId: owner.organizationId!,
      tradeId: id,
      sourceType: "structured_file",
      rawPayload: { invoice: "INV-001", rows: [1, 2] },
      createdBy: owner.id,
    });
    expect(
      (await database.getSourceIngestionReceiptById(receiptId))?.rawPayload
    ).toEqual({ invoice: "INV-001", rows: [1, 2] });
    expect((await database.getTradeWorkspace(id))!.documents).toHaveLength(6);
  });
  it("counts routed receipts correctly and refuses a second routing decision", async () => {
    const owner = await account();
    const tradeId = await trade(owner);
    const receiptId = await database.createSourceIngestionReceipt({
      organizationId: owner.organizationId!,
      sourceType: "webhook",
      routingStatus: "pending",
      createdBy: owner.id,
    });
    const input = {
      receiptId,
      tradeId,
      routedBy: owner.id,
      routingContext: { rationale: "Confirmed reference" },
    };
    expect(await database.routeSourceIngestionReceipt(input)).toBe(1);
    expect(await database.routeSourceIngestionReceipt(input)).toBe(0);
  });
  it("upserts schedule, policy, external-reference, and capability conflict targets", async () => {
    const owner = await account();
    for (const threshold of [2, 8])
      await database.upsertWorkflowAlertPolicy({
        organizationId: owner.organizationId!,
        alertType: "source_health",
        enabled: true,
        severity: "warning",
        threshold,
        updatedBy: owner.id,
      });
    expect(
      await database.getWorkflowAlertPolicies(owner.organizationId!)
    ).toHaveLength(1);
    expect(
      (await database.getWorkflowAlertPolicies(owner.organizationId!))[0]
        .threshold
    ).toBe(8);
    for (const cronExpression of ["0 * * * *", "0 2 * * *"])
      await database.registerOperationalSchedule({
        scheduleKey: "health",
        taskUid: "task-01",
        cronExpression,
      });
    expect(
      (await database.getOperationalSchedule("health"))?.cronExpression
    ).toBe("0 2 * * *");
    for (const version of [1, 2])
      await database.recordExternalReference({
        organizationId: owner.organizationId!,
        entityType: "trade",
        providerName: "test",
        externalId: "ext-01",
        payload: { version },
        observedAt: new Date(),
      });
    const refs = await engine.client!.query<{ payload: unknown }>(
      'select payload from "externalReferences"'
    );
    expect(refs.rows).toEqual([{ payload: { version: 2 } }]);
    const membership = await engine.client!.query<{ id: number }>(
      'select id from "memberships"'
    );
    for (let i = 0; i < 2; i++)
      await database.addCapabilityGrant({
        membershipId: membership.rows[0].id,
        capability: "trade.view",
        grantedBy: owner.id,
      });
    expect(
      (await engine.client!.query('select * from "capabilityGrants"')).rows
    ).toHaveLength(1);
  });
  it("reconstructs the Shadow Audit workspace and dashboard using PostgreSQL joins", async () => {
    const owner = await account();
    const seeded = await database.createShadowAuditTrade(owner.id);
    const workspace = (await database.getTradeWorkspace(seeded.tradeId))!;
    expect(workspace.trade.reference).toBe(seeded.reference);
    expect(workspace.documents).toHaveLength(6);
    expect(workspace.exceptions).toHaveLength(2);
    const dashboard = await database.getDashboardData(owner);
    expect(dashboard.activeTrades).toBe(1);
    expect(dashboard.trades[0].id).toBe(seeded.tradeId);
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await import("../scripts/enrich-shadow-audit");
    } finally {
      output.mockRestore();
    }
    const enriched = (await database.getTradeWorkspace(seeded.tradeId))!;
    expect(enriched.lines).toHaveLength(1);
    expect(enriched.paymentTerms).toHaveLength(1);
  });
  it("enforces native enums and foreign keys and refreshes updatedAt on application updates", async () => {
    const owner = await account();
    const id = await trade(owner);
    await expect(
      engine.client!.query(
        'update trades set "assuranceState" = $1 where id = $2',
        ["not_a_state", id]
      )
    ).rejects.toThrow();
    await expect(
      engine.client!.query(
        'insert into memberships ("organizationId", "userId", role) values (9999, 9999, $1)',
        ["trader"]
      )
    ).rejects.toThrow();
    const db = await database.getDb();
    const oldDate = new Date("2020-01-01T00:00:00Z");
    await db!
      .update(trades)
      .set({ updatedAt: oldDate })
      .where(eq(trades.id, id));
    await db!
      .update(trades)
      .set({ commodity: "Updated cotton" })
      .where(eq(trades.id, id));
    expect(
      (await database.getTradeById(id))!.updatedAt.getTime()
    ).toBeGreaterThan(oldDate.getTime());
  });
});

it("uploads, extracts, versions, and authorizes private evidence through the real trade router", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "arcway-evidence-flow-"));
  vi.stubEnv("STORAGE_LOCAL_DIR", root);
  try {
    await database.upsertUser({ openId: "evidence-trader", role: "trader", name: "Evidence Trader" });
    const owner = (await database.getUserByOpenId("evidence-trader"))!;
    const id = await trade(owner);
    await database.createDocumentPlaceholders(id);
    const documents = await database.getTradeDocuments(id);
    const invoice = documents.find(item => item.documentType === "commercial invoice")!;
    const caller = tradeRouter.createCaller({ user: owner, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
    const text = "Synthetic invoice TEST-001. Seller: Seller. Buyer: Buyer. Quantity 1200.125 kg. Total USD 30603.19. FOB.";
    const result = await caller.documents.upload({ documentId: invoice.id, fileName: "synthetic-invoice.txt", mimeType: "text/plain", base64: Buffer.from(text).toString("base64") });
    expect(result.success).toBe(true);
    expect(result.fields.invoiceNumber).toBe("TEST-001");
    const saved = (await database.getDocumentById(invoice.id))!;
    expect(saved.status).toBe("uploaded");
    const uploadedWorkspace = (await caller.get({ tradeId: id }))!;
    const invoiceField = uploadedWorkspace.fields.find(field => field.fieldName === "invoiceNumber")!;
    expect(invoiceField).toMatchObject({ documentId: invoice.id, fieldValue: "TEST-001", authority: "supporting", confidence: "0.9700", confirmedBy: null });
    expect(invoiceField.sourceLocation).toMatchObject({ sourceType: "document_upload", fileKey: saved.fileKey, fileName: "synthetic-invoice.txt", documentType: "commercial invoice", documentVersion: 1 });
    expect(uploadedWorkspace.fields.some(field => ["confidence", "issues"].includes(field.fieldName))).toBe(false);
    expect(uploadedWorkspace.fields.some(field => ["shipmentDate", "transportReference"].includes(field.fieldName))).toBe(false);
    expect(buildComparisonMatrix(uploadedWorkspace.fields).find(row => row.fieldName === "invoiceNumber")?.cells).toEqual([expect.objectContaining({ source: "commercial invoice", value: "TEST-001" })]);
    expect((await storageRead(saved.fileKey!)).buffer.toString()).toBe(text);
    expect(await database.getStoredFileForUser(saved.fileKey!, owner)).toEqual({ fileName: "synthetic-invoice.txt" });
    await database.upsertUser({ openId: "unrelated-trader", role: "trader" });
    const outsider = (await database.getUserByOpenId("unrelated-trader"))!;
    expect(await database.getStoredFileForUser(saved.fileKey!, outsider)).toBeUndefined();
    expect(await database.getStoredFileForUser(saved.fileKey!, { ...outsider, organizationId: owner.organizationId })).toBeUndefined();
    expect(await database.getStoredFileForUser(saved.fileKey!, { ...outsider, role: "reviewer" })).toBeUndefined();
    await caller.documents.upload({ documentId: invoice.id, fileName: "replacement.txt", mimeType: "text/plain", base64: Buffer.from(text + " replacement").toString("base64") });
    const workspace = (await database.getTradeWorkspace(id))!;
    const versions = workspace.documentVersions.filter(item => item.documentId === invoice.id);
    expect(versions.map(item => item.version).sort()).toEqual([1, 2]);
    expect(workspace.fields).toHaveLength(uploadedWorkspace.fields.length);
    expect(workspace.fields.every(field => (field.sourceLocation as any).fileName === "replacement.txt")).toBe(true);
    expect(workspace.fieldHistory.filter(field => field.validTo)).toHaveLength(uploadedWorkspace.fields.length);
    expect(await database.getStoredFileForUser(saved.fileKey!, owner)).toBeDefined();
    const otherCaller = tradeRouter.createCaller({ user: outsider, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(otherCaller.documents.upload({ documentId: invoice.id, fileName: "forbidden.txt", mimeType: "text/plain", base64: Buffer.from(text).toString("base64") })).rejects.toMatchObject({ code: "FORBIDDEN" });
  } finally { vi.stubEnv("STORAGE_LOCAL_DIR", ".data/uploads"); await rm(root, { recursive: true, force: true }); }
});

it("deduplicates Gmail receipts and limits their files to the destination workspace", async () => {
  const owner = await account();
  const id = await trade(owner);
  const receipt = { organizationId: owner.organizationId!, tradeId: id, createdBy: owner.id, payloadHash: "unique-gmail-message", fileName: "invoice.pdf", fileKey: "ingestion/test/invoice.pdf", rawPayload: { provider: "gmail", subject: "Order" } };
  expect(await database.saveGmailReceipt(receipt)).toBe(true);
  expect(await database.saveGmailReceipt(receipt)).toBe(false);
  const results = await database.listSourceIngestionReceiptsForUser({ userId: owner.id, organizationId: owner.organizationId!, role: "reviewer" });
  expect(results).toHaveLength(1);
  expect(await database.getStoredFileForUser(receipt.fileKey, owner)).toEqual({ fileName: "invoice.pdf" });
  expect(await database.getStoredFileForUser(receipt.fileKey, { ...owner, organizationId: 999 })).toBeUndefined();
});

it("exposes two uploaded documents and their disagreement through the same evidence read by the matrix", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "arcway-comparison-flow-"));
  vi.stubEnv("STORAGE_LOCAL_DIR", root);
  try {
    await database.upsertUser({ openId: "comparison-trader", role: "trader" });
    const user = (await database.getUserByOpenId("comparison-trader"))!;
    const id = await trade(user);
    await database.createDocumentPlaceholders(id);
    const docs = await database.getTradeDocuments(id);
    const caller = tradeRouter.createCaller({ user, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
    const upload = (documentId: number, name: string) => caller.documents.upload({ documentId, fileName: name, mimeType: "text/plain", base64: Buffer.from("Synthetic trade document for integration testing.").toString("base64") });
    await upload(docs.find(doc => doc.documentType === "commercial invoice")!.id, "invoice.txt");
    const extraction = { invoiceNumber: "TEST-001", issueDate: "2026-10-17", currency: "USD", totalAmount: "", unitPrice: "", sellerName: "Seller", buyerName: "Buyer", quantity: "950", unit: "kg", incoterm: "FOB", originCountry: "BD", destinationCountry: "DE", transportReference: "", shipmentDate: "", confidence: 0.92, issues: [] };
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(extraction) } }] } as any);
    await upload(docs.find(doc => doc.documentType === "packing list")!.id, "packing-list.txt");
    const workspace = (await caller.get({ tradeId: id }))!;
    const quantity = buildComparisonMatrix(workspace.fields).find(row => row.fieldName === "quantity")!;
    expect(quantity.conflicting).toBe(true);
    expect(quantity.cells).toEqual(expect.arrayContaining([expect.objectContaining({ source: "commercial invoice", value: "1200.125" }), expect.objectContaining({ source: "packing list", value: "950" })]));
    expect(workspace.exceptions.some(exception => exception.detail.includes("quantity"))).toBe(true);
    expect(workspace.trade.quantity).toBe("1200.125"); // Uploads never choose canonical values.
    expect(workspace.canonicalResolutions).toHaveLength(0);
  } finally { vi.stubEnv("STORAGE_LOCAL_DIR", ".data/uploads"); await rm(root, { recursive: true, force: true }); }
});

it("backfills existing uploads idempotently without replacing human-confirmed evidence", async () => {
  const owner = await account();
  const id = await trade(owner);
  await database.createDocumentPlaceholders(id);
  const invoice = (await database.getTradeDocuments(id))[0];
  const db = (await database.getDb())!;
  await db.update(tradeDocuments).set({ status: "uploaded", fileKey: "legacy/invoice.txt", fileName: "legacy.txt", mimeType: "text/plain", uploadedAt: new Date(), extractedData: { invoiceNumber: "LEGACY-001", quantity: "1000", totalAmount: 0, confidence: 0.75, issues: ["Review required"], buyerName: "  ", unsupportedMetadata: "ignore" } }).where(eq(tradeDocuments.id, invoice.id));
  const confirmedId = await database.createConfirmedEvidenceField({ tradeId: id, fieldName: "quantity", fieldValue: "999", sourceLocation: { sourceName: "Reviewed spreadsheet" }, confirmedBy: owner.id });
  const dryRun = await database.backfillDocumentEvidence({ dryRun: true });
  expect(dryRun.inserted).toBe(3);
  expect((await database.getTradeWorkspace(id))!.fields).toHaveLength(1);
  const first = await database.backfillDocumentEvidence();
  expect(first.inserted).toBe(3);
  const before = (await database.getTradeWorkspace(id))!.fields;
  expect(before.find(field => field.fieldName === "totalAmount")?.fieldValue).toBe("0");
  expect(before.find(field => field.id === confirmedId)?.authority).toBe("authoritative");
  const repeat = await database.backfillDocumentEvidence();
  expect(repeat).toMatchObject({ inserted: 0, retired: 0 });
  expect(await database.backfillDocumentEvidence({ dryRun: true })).toMatchObject({ inserted: 0, retired: 0 });
  expect((await database.getTradeWorkspace(id))!.fields.map(field => field.id).sort()).toEqual(before.map(field => field.id).sort());
  expect((await database.getTradeWorkspace(id))!.fields.every(field => !["issues", "confidence", "buyerName", "unsupportedMetadata"].includes(field.fieldName))).toBe(true);
});

it("retires replaced source fields while retaining prior evidence and reviewer references", async () => {
  const owner = await account();
  const id = await trade(owner);
  await database.createDocumentPlaceholders(id);
  const document = (await database.getTradeDocuments(id))[0];
  const base = { documentId: document.id, userId: owner.id, fileName: "invoice.txt", fileUrl: "/api/storage/first.txt", fileKey: "trades/first.txt", mimeType: "text/plain", extractedData: { quantity: "950", confidence: 0.9 }, inconsistencies: [] };
  await database.updateDocumentUpload(base);
  const prior = (await database.getTradeWorkspace(id))!.fields[0];
  const resolutionId = await database.createCanonicalResolution({ tradeId: id, fieldName: "quantity", selectedEvidenceFieldId: prior.id, selectedValue: "950", rationale: "Reviewer retained original evidence decision.", resolvedBy: owner.id });
  await database.updateDocumentUpload({ ...base, fileKey: "trades/replacement.txt", fileUrl: "/api/storage/replacement.txt", extractedData: { quantity: "1000", confidence: 0.95 } });
  const workspace = (await database.getTradeWorkspace(id))!;
  expect(buildComparisonMatrix(workspace.fields)).toEqual([expect.objectContaining({ fieldName: "quantity", conflicting: false, values: ["1000"] })]);
  expect(workspace.fieldHistory.find(field => field.id === prior.id)?.validTo).toBeInstanceOf(Date);
  expect(workspace.canonicalResolutions.find(resolution => resolution.id === resolutionId)?.selectedEvidenceFieldId).toBe(prior.id);
  await database.updateDocumentUpload({ ...base, fileKey: "trades/unreadable.txt", extractedData: { confidence: 0, issues: ["No readable text"] } });
  expect((await database.getTradeWorkspace(id))!.fields).toHaveLength(0);
});

it("rolls back the document and version if publishing evidence fails", async () => {
  const owner = await account();
  const id = await trade(owner);
  await database.createDocumentPlaceholders(id);
  const document = (await database.getTradeDocuments(id))[0];
  await engine.client!.exec('ALTER TABLE "evidenceFields" ADD CONSTRAINT evidence_failure_test CHECK ("fieldValue" <> \'forced-evidence-failure\')');
  try {
    await expect(database.updateDocumentUpload({ documentId: document.id, userId: owner.id, fileName: "invoice.txt", fileKey: "trades/fail.txt", fileUrl: "/api/storage/trades/fail.txt", mimeType: "text/plain", extractedData: { quantity: "forced-evidence-failure", confidence: 0.9 }, inconsistencies: [] })).rejects.toThrow();
    const workspace = (await database.getTradeWorkspace(id))!;
    expect(workspace.documents.find(doc => doc.id === document.id)?.status).toBe("pending");
    expect(workspace.documentVersions).toHaveLength(0);
    expect(workspace.fields).toHaveLength(0);
  } finally { await engine.client!.exec('ALTER TABLE "evidenceFields" DROP CONSTRAINT evidence_failure_test'); }
});

it("propagates reviewer corrections to comparisons, both sources, exceptions, trust and retained readiness", async () => {
  const owner = await account();
  const id = await trade(owner);
  await database.createDocumentPlaceholders(id);
  const documents = await database.getTradeDocuments(id);
  const invoice = documents.find(doc => doc.documentType === "commercial invoice")!;
  const packing = documents.find(doc => doc.documentType === "packing list")!;
  const fields = { ...Object.fromEntries(DOCUMENT_FIELD_NAMES.map(field => [field, ""])), quantity: "1000", confidence: 0.95, issues: [] };
  const upload = (documentId: number, quantity: string) => database.updateDocumentUpload({ documentId, userId: owner.id, fileName: "synthetic.txt", fileKey: `trades/${documentId}.txt`, fileUrl: `/api/storage/trades/${documentId}.txt`, mimeType: "text/plain", extractedData: { ...fields, quantity }, inconsistencies: [] });
  await upload(invoice.id, "1000");
  await upload(packing.id, "950");
  const db = (await database.getDb())!;
  await db.update(tradeDocuments).set({ status: "verified" }).where(eq(tradeDocuments.tradeId, id));
  await db.update(trades).set({ assuranceState: "approved", commercialState: "confirmed" }).where(eq(trades.id, id));
  await db.insert(tradeExceptions).values({ tradeId: id, documentId: invoice.id, category: "compliance", severity: "critical", title: "Manual compliance hold", detail: "Requires independent review" });
  const before = (await database.getTradeWorkspace(id))!;
  expect(before.exceptions.filter(item => item.status === "open" && item.title === "Cross-document inconsistency")).toHaveLength(2);
  const caller = appRouter.createCaller({ user: owner, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
  const corrected = await caller.operations.documents.correctExtraction({ documentId: packing.id, extractedData: fields, reviewerNotes: "Quantity confirmed against retained invoice." });
  const after = (await database.getTradeWorkspace(id))!;
  expect(after.documents.find(doc => doc.id === packing.id)?.status).toBe("under review");
  expect(after.documents.every(doc => Array.isArray(doc.inconsistencies) && doc.inconsistencies.length === 0)).toBe(true);
  expect(after.exceptions.filter(item => item.title === "Cross-document inconsistency").every(item => item.status === "resolved" && item.resolutionOutcome === "corrected")).toBe(true);
  expect(after.exceptions.find(item => item.title === "Manual compliance hold")?.status).toBe("open");
  expect(buildComparisonMatrix(after.fields).find(row => row.fieldName === "quantity")).toMatchObject({ conflicting: false, values: ["1000"] });
  expect(after.trade.assuranceState).toBe("under_review");
  expect(after.trade.trustScore).toBe(corrected.trust.score);
  expect(after.preflightRuns).toHaveLength(before.preflightRuns.length + 1);
  expect((after.preflightRuns[0].evidenceSnapshot as any).evidenceFieldIds.sort()).toEqual(after.fields.map(field => field.id).sort());
  expect(after.documentVersions.filter(version => version.documentId === packing.id).map(version => version.source)).toEqual(expect.arrayContaining(["user_upload", "reviewer_correction"]));
  expect(after.events.some(event => event.eventType === "document.extraction_corrected" && event.actorId === owner.id)).toBe(true);
  const trader = { ...owner, role: "trader" as const };
  await expect(appRouter.createCaller({ user: trader, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }).operations.documents.correctExtraction({ documentId: packing.id, extractedData: fields, reviewerNotes: "Unauthorized correction" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(caller.operations.documents.correctExtraction({ documentId: packing.id, extractedData: { ...fields, confidence: 2 }, reviewerNotes: "Invalid extraction confidence" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
});

it("rolls back the entire correction when its audit record cannot be retained", async () => {
  const owner = await account(); const id = await trade(owner);
  await database.createDocumentPlaceholders(id);
  const doc = (await database.getTradeDocuments(id))[0];
  await database.updateDocumentUpload({ documentId: doc.id, userId: owner.id, fileName: "original.txt", fileKey: "trades/original.txt", fileUrl: "/api/storage/trades/original.txt", mimeType: "text/plain", extractedData: { quantity: "1000", issues: [] }, inconsistencies: [] });
  const before = (await database.getTradeWorkspace(id))!;
  await engine.client!.exec('ALTER TABLE "auditRecords" ADD CONSTRAINT correction_failure_test CHECK ("action" <> \'document.extraction_corrected\')');
  try {
    await expect(database.correctDocumentExtraction({ documentId: doc.id, reviewerId: owner.id, extractedData: { quantity: "500", issues: [] }, reviewerNotes: "Synthetic rollback test" })).rejects.toThrow();
    const after = (await database.getTradeWorkspace(id))!;
    expect(after.documents).toEqual(before.documents);
    expect(after.fields).toEqual(before.fields);
    expect(after.documentVersions).toEqual(before.documentVersions);
    expect(after.preflightRuns).toEqual(before.preflightRuns);
  } finally { await engine.client!.exec('ALTER TABLE "auditRecords" DROP CONSTRAINT correction_failure_test'); }
});

it("executes only due workspace schedules, retains outcomes, and avoids duplicate escalations", async () => {
  const owner = await account(); const id = await trade(owner);
  await (await database.getDb())!.update(trades).set({ reference: "AR-PG-OWN" }).where(eq(trades.id, id));
  await database.upsertUser({ openId: "other-schedule-owner", role: "reviewer" });
  const other = (await database.getUserByOpenId("other-schedule-owner"))!;
  const otherTradeId = await trade(other);
  await database.createTradeObligation({ tradeId: id, actor: "Supplier", action: "Deliver evidence", deadline: new Date("2025-01-01"), criticality: "critical" });
  await database.createTradeObligation({ tradeId: otherTradeId, actor: "Other supplier", action: "Other workspace delivery", deadline: new Date("2025-01-01"), criticality: "critical" });
  const job = await database.configureWorkspaceSchedule(owner.organizationId!, "0 */15 * * * *");
  const changed = await database.configureWorkspaceSchedule(owner.organizationId!, "0 */15 * * * *");
  expect(changed.taskUid).toBe(job.taskUid);
  const db = (await database.getDb())!;
  const baseline = new Date("2026-10-01T00:00:00Z");
  await db.update(operationalSchedules).set({ createdAt: baseline, updatedAt: baseline }).where(eq(operationalSchedules.taskUid, job.taskUid));
  expect(await database.runDueOperationalSchedules(new Date("2026-10-01T00:14:59Z"))).toMatchObject({ executed: 0 });
  expect(await database.runDueOperationalSchedules(new Date("2026-10-01T00:15:00Z"))).toMatchObject({ executed: 1 });
  expect(await database.runDueOperationalSchedules(new Date("2026-10-01T00:15:01Z"))).toMatchObject({ executed: 0 });
  const own = (await database.getTradeWorkspace(id))!;
  const foreign = (await database.getTradeWorkspace(otherTradeId))!;
  expect(own.obligations[0].status).toBe("overdue");
  expect(own.obligationEscalations).toHaveLength(1);
  expect(foreign.obligations[0].status).toBe("open");
  expect(foreign.obligationEscalations).toHaveLength(0);
  expect((await database.getOperationalSchedule(`workspace-sweep-${owner.organizationId}`))?.lastResult).toMatchObject({ obligations: { escalated: 1 } });
  await database.configureWorkspaceSchedule(owner.organizationId!, "0 */15 * * * *", false);
  expect(await database.runDueOperationalSchedules(new Date("2027-01-01T00:00:00Z"))).toMatchObject({ executed: 0 });
  expect((await database.runWorkspaceOperationalSweep(owner.organizationId!)).obligations.escalated).toBe(0);
});

it("rolls back a failed scheduled sweep, retains its error with PostgreSQL timestamp precision, and retries", async () => {
  const owner = await account(); const id = await trade(owner);
  await database.createTradeObligation({ tradeId: id, actor: "Supplier", action: "Provide original evidence", deadline: new Date("2025-01-01"), criticality: "critical" });
  const job = await database.configureWorkspaceSchedule(owner.organizationId!, "* * * * * *");
  await engine.client!.query('UPDATE "operationalSchedules" SET "createdAt"=$1, "updatedAt"=$1 WHERE "taskUid"=$2', ["2026-10-01T00:00:00.123456Z", job.taskUid]);
  await engine.client!.exec('ALTER TABLE "auditRecords" ADD CONSTRAINT scheduler_failure_test CHECK ("action" <> \'monitoring.scheduled_sweep\')');
  try {
    expect(await database.runDueOperationalSchedules(new Date("2026-10-01T00:00:05Z"))).toMatchObject({ executed: 0, failed: 1 });
    expect((await database.getTradeWorkspace(id))!.obligationEscalations).toHaveLength(0);
    expect((await database.getOperationalSchedule(`workspace-sweep-${owner.organizationId}`))?.lastError).toContain("will retry");
  } finally { await engine.client!.exec('ALTER TABLE "auditRecords" DROP CONSTRAINT scheduler_failure_test'); }
  expect(await database.runDueOperationalSchedules(new Date("2026-10-01T00:00:10Z"))).toMatchObject({ executed: 1, failed: 0 });
  expect((await database.getTradeWorkspace(id))!.obligationEscalations).toHaveLength(1);
  expect((await database.getOperationalSchedule(`workspace-sweep-${owner.organizationId}`))?.lastError).toBeNull();
});

it("retains Vercel file bytes and encrypted tokens across runtime reloads with one-time OAuth state", async () => {
  vi.stubEnv("RUNTIME_STATE_BACKEND", "postgres");
  vi.stubEnv("INTEGRATION_ENCRYPTION_KEY", "a".repeat(64));
  try {
    const runtime = await import("./runtimeState");
    const storage = await import("./storage");
    const vault = await import("./integrations/tokenVault");
    const bytes = Buffer.from("synthetic private invoice");
    const file = await storage.storagePut("trades/1/test.txt", bytes, "text/plain");
    expect((await storage.storageRead(file.key)).buffer).toEqual(bytes);
    await vault.writeGmailToken(1, { refreshToken: "synthetic-refresh-token", organizationId: 1 });
    const encrypted = await runtime.readRuntimeState<any>("gmail-token", "1");
    expect(JSON.stringify(encrypted)).not.toContain("synthetic-refresh-token");
    expect(await vault.readGmailToken(1)).toEqual({ refreshToken: "synthetic-refresh-token", organizationId: 1 });
    expect(await vault.readGmailToken(2)).toBeNull();
    await runtime.putRuntimeState("gmail-oauth", "user1-state", { userId: 1 }, new Date(Date.now() + 60_000));
    const consumed = await Promise.all([runtime.consumeRuntimeState("gmail-oauth", "user1-state"), runtime.consumeRuntimeState("gmail-oauth", "user1-state")]);
    expect(consumed.filter(Boolean)).toHaveLength(1);
    await runtime.putRuntimeState("gmail-oauth", "expired", {}, new Date(Date.now() - 1000));
    expect(await runtime.consumeRuntimeState("gmail-oauth", "expired")).toBeNull();
    const lease = await runtime.acquireRuntimeLease("gmail-sync", "1");
    expect(lease).toBeTruthy(); expect(await runtime.acquireRuntimeLease("gmail-sync", "1")).toBeNull();
    await runtime.releaseRuntimeLease("gmail-sync", "1", "wrong-token");
    expect(await runtime.acquireRuntimeLease("gmail-sync", "1")).toBeNull();
    await runtime.releaseRuntimeLease("gmail-sync", "1", lease!);
    expect(await runtime.acquireRuntimeLease("gmail-sync", "1")).toBeTruthy();
    await storage.storageDelete(file.key);
    await expect(storage.storageRead(file.key)).rejects.toMatchObject({ code: "ENOENT" });
    await vault.removeGmailToken(1); expect(await vault.readGmailToken(1)).toBeNull();
  } finally { vi.stubEnv("RUNTIME_STATE_BACKEND", ""); }
});
