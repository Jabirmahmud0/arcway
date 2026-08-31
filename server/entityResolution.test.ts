import { describe, expect, it } from "vitest";
import { buildEntityResolutionProposals } from "./entityResolution";

describe("buildEntityResolutionProposals", () => {
  it("proposes strong same-country aliases for human review without returning inactive master versions", () => {
    const proposals = buildEntityResolutionProposals([
      { id: 1, legalName: "Nord Haus GmbH", countryCode: "DE", taxId: null, tradingNames: ["NORDHAUS"], validTo: null },
      { id: 2, legalName: "NordHaus Germany", countryCode: "DE", taxId: null, tradingNames: null, validTo: null },
      { id: 3, legalName: "Nord Haus GmbH", countryCode: "DE", taxId: null, tradingNames: null, validTo: new Date() },
      { id: 4, legalName: "NordHaus Germany", countryCode: "NL", taxId: null, tradingNames: null, validTo: null },
    ]);
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ confidence: expect.any(Number), disposition: "review_required", signals: ["normalized name containment with same retained country"] });
    expect(proposals[0].left.id).toBe(1);
    expect(proposals[0].right.id).toBe(2);
  });

  it("does not propose weakly similar or cross-country masters", () => {
    expect(buildEntityResolutionProposals([
      { id: 1, legalName: "Harbor Foods LLC", countryCode: "US", taxId: null, tradingNames: null, validTo: null },
      { id: 2, legalName: "Harbor Logistics LLC", countryCode: "US", taxId: null, tradingNames: null, validTo: null },
      { id: 3, legalName: "Harbor Foods LLC", countryCode: "CA", taxId: null, tradingNames: null, validTo: null },
    ])).toEqual([]);
  });
});
