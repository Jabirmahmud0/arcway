import { describe, expect, it } from "vitest";
import { canRespondToPartnerRequest, canTransitionPartnerRequest } from "./partnerAccess";
import { applyStructuredFieldMapping, readMappedFieldForConfirmation } from "./structuredMapping";

describe("ARCWAY scoped partner collaboration", () => {
  const grant = { tradeId: 10, recipientEmail: "partner@example.com", status: "active", expiresAt: new Date("2030-01-01T00:00:00Z"), scope: ["trade.read", "partner_request.respond"] };
  it("permits an active recipient only for its exact trade request", () => {
    expect(canRespondToPartnerRequest(grant, { tradeId: 10, recipientEmail: "PARTNER@example.com" }, new Date("2029-01-01T00:00:00Z"))).toBe(true);
    expect(canRespondToPartnerRequest(grant, { tradeId: 11, recipientEmail: "partner@example.com" }, new Date("2029-01-01T00:00:00Z"))).toBe(false);
  });
  it("rejects expired grants and grants without the response scope", () => {
    expect(canRespondToPartnerRequest({ ...grant, expiresAt: new Date("2020-01-01T00:00:00Z") }, { tradeId: 10, recipientEmail: "partner@example.com" })).toBe(false);
    expect(canRespondToPartnerRequest({ ...grant, scope: ["trade.read"] }, { tradeId: 10, recipientEmail: "partner@example.com" }, new Date("2029-01-01T00:00:00Z"))).toBe(false);
  });
  it("permits only valid operational partner-request transitions", () => {
    expect(canTransitionPartnerRequest("responded", "accepted")).toBe(true);
    expect(canTransitionPartnerRequest("accepted", "completed")).toBe(true);
    expect(canTransitionPartnerRequest("sent", "completed")).toBe(false);
  });
});

describe("ARCWAY structured source mapping", () => {
  it("maps multiple rows into canonical field keys while preserving missing values as null", () => {
    expect(applyStructuredFieldMapping([{ Invoice: "INV-1", Quantity: 10 }, { Invoice: "INV-2" }], { Invoice: "invoice_number", Quantity: "quantity" })).toEqual([{ invoice_number: "INV-1", quantity: 10 }, { invoice_number: "INV-2", quantity: null }]);
  });
  it("requires a non-blank mapped field before reviewer confirmation can continue", () => {
    const rows = [{ invoice_number: "INV-9", quantity: null }];
    expect(readMappedFieldForConfirmation(rows, 0, "invoice_number")).toBe("INV-9");
    expect(readMappedFieldForConfirmation(rows, 0, "quantity")).toBeNull();
    expect(readMappedFieldForConfirmation(rows, 1, "invoice_number")).toBeNull();
  });
});
