import { eq } from "drizzle-orm";
import {
  approvals,
  comments,
  counterparties,
  evidenceFields,
  paymentRecords,
  paymentTerms,
  policyPacks,
  policyVersions,
  preflightRuns,
  products,
  shipmentAllocations,
  shipmentEvents,
  shipments,
  tradeLines,
  tradeRevisions,
  trades,
  users,
} from "../drizzle/schema";
import { getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const [trade] = await db.select().from(trades).limit(1);
if (!trade) throw new Error("No Trade Twin exists to enrich");
const [owner] = await db.select().from(users).where(eq(users.id, trade.ownerId)).limit(1);
if (!owner?.organizationId) throw new Error("The Trade Twin owner has no workspace");

const [existing] = await db.select().from(tradeLines).where(eq(tradeLines.tradeId, trade.id)).limit(1);
if (!existing) {
  const productResult = await db.insert(products).values({ organizationId: owner.organizationId, sku: "AC-ARABICA-G1", buyerSku: "NF-COF-240", description: "Grade 1 Arabica coffee beans", countryOfOrigin: "BR", hsClassification: "090111", leadTimeDays: 18, certifications: ["Certificate of origin", "Inspection certificate"] });
  const productId = Number(productResult[0].insertId);
  await db.insert(counterparties).values({ organizationId: owner.organizationId, legalName: trade.buyerName, countryCode: trade.buyerCountry, contacts: [{ name: "Lena Hoffmann", role: "Import operations" }], requiredCertificates: ["Certificate of origin", "Inspection certificate"] });
  await db.insert(tradeLines).values({ tradeId: trade.id, productId, sequence: 1, sku: "AC-ARABICA-G1", description: trade.commodity, quantity: trade.quantity, unit: trade.unit, unitPrice: trade.unitPrice, totalValue: trade.totalValue, source: "Buyer PO" });
  await db.insert(evidenceFields).values([
    { tradeId: trade.id, fieldName: "quantity", fieldValue: "24000", authority: "authoritative", confidence: "0.9980", sourceLocation: { document: "Buyer PO", page: 1, label: "Quantity" }, modelVersion: "manual-shadow-audit", extractedAt: new Date() },
    { tradeId: trade.id, fieldName: "quantity", fieldValue: "23800", authority: "conflicting", confidence: "0.9300", sourceLocation: { document: "Packing list", page: 1, label: "Net quantity" }, modelVersion: "manual-shadow-audit", extractedAt: new Date() },
    { tradeId: trade.id, fieldName: "incoterm", fieldValue: "FOB", authority: "authoritative", confidence: "0.9900", sourceLocation: { document: "Buyer PO", page: 1 }, modelVersion: "manual-shadow-audit", extractedAt: new Date() },
    { tradeId: trade.id, fieldName: "incoterm", fieldValue: "CIF", authority: "conflicting", confidence: "0.9600", sourceLocation: { document: "Commercial invoice", page: 1 }, modelVersion: "manual-shadow-audit", extractedAt: new Date() },
  ]);
  const policyResult = await db.insert(policyPacks).values({ organizationId: owner.organizationId, name: "Documentary shipment readiness", scope: "transport", status: "active", ownerId: owner.id });
  const policyPackId = Number(policyResult[0].insertId);
  await db.insert(policyVersions).values({ policyPackId, version: 1, rules: [{ if: { mode: "sea" }, then: { require: ["packing list", "bill of lading", "certificate of origin"] } }], effectiveFrom: new Date(), source: "Shadow Audit policy" });
  await db.insert(preflightRuns).values({ tradeId: trade.id, gate: "ready_to_ship", status: "blocked", checks: [{ title: "Quantity reconciliation", status: "blocked", impact: "Shipping instruction cannot be issued" }, { title: "Certificate of origin", status: "at_risk", impact: "Presentation may be delayed" }], policySnapshot: { policy: "Documentary shipment readiness", version: 1 }, evidenceSnapshot: { sources: ["Buyer PO", "Commercial invoice", "Packing list"] }, runBy: owner.id });
  const shipmentResult = await db.insert(shipments).values({ organizationId: owner.organizationId, mode: "sea", carrier: "Demonstration Carrier", forwarder: "Harborline Logistics", bookingReference: "BK-AR-88421", origin: "Santos", destination: "Hamburg", etd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), eta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), vessel: "MV Arc Meridian", voyage: "AM-203", cutoffs: { shippingInstruction: "2026-09-01T16:00:00Z", cargo: "2026-09-02T12:00:00Z" }, status: "booked" });
  const shipmentId = Number(shipmentResult[0].insertId);
  await db.insert(shipmentAllocations).values({ shipmentId, tradeId: trade.id, allocatedQuantity: trade.quantity, allocatedValue: trade.totalValue });
  await db.insert(shipmentEvents).values([{ shipmentId, eventType: "booking_confirmed", location: "Santos", plannedAt: new Date(), source: "carrier_adapter" }, { shipmentId, eventType: "shipping_instruction_cutoff", location: "Santos", plannedAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), source: "carrier_adapter" }]);
  const termResult = await db.insert(paymentTerms).values({ tradeId: trade.id, method: "letter_of_credit", depositPercent: "0.00", presentationDays: 21, latestShipmentDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45), lcReference: "LC-07191", specialClauses: ["Original bill of lading required", "Certificate of origin required"] });
  const paymentTermId = Number(termResult[0].insertId);
  await db.insert(paymentRecords).values({ tradeId: trade.id, paymentTermId, amount: trade.totalValue, currency: trade.currency, status: "expected" });
  await db.insert(approvals).values({ organizationId: owner.organizationId, tradeId: trade.id, type: "ship_with_critical_discrepancy", status: "pending", requestedBy: owner.id, reason: "Quantity discrepancy needs explicit Head of Operations decision before shipment release.", evidence: { exception: "Quantity discrepancy" } });
  await db.insert(comments).values([{ tradeId: trade.id, authorId: owner.id, body: "Packing list quantity requires exporter confirmation before the shipping instruction cut-off." }, { tradeId: trade.id, authorId: owner.id, body: "Commercial invoice must be corrected or an approved exception recorded for the Incoterm contradiction." }]);
  await db.insert(tradeRevisions).values({ tradeId: trade.id, version: 1, reason: "Shadow Audit reconstruction created from historical documents", afterState: { quantity: "24000", incoterm: "FOB", sourcePriority: "Buyer PO" }, source: "shadow_audit", observedAt: new Date(Date.now() - 1000 * 60 * 60 * 36), recordedBy: owner.id });
}

console.log(JSON.stringify({ tradeId: trade.id, reference: trade.reference, enriched: true }));
