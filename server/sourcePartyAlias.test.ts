import { describe, expect, it } from "vitest";
import { buildSourcePartyAliasProposals } from "./sourcePartyAlias";

const masters = [{ id: 1, legalName: "Meridian Export House LLC", countryCode: "US", tradingNames: ["Meridian Export"], validTo: null }, { id: 2, legalName: "Nord Coast Supplies GmbH", countryCode: "DE", tradingNames: null, validTo: null }, { id: 3, legalName: "Meridian Export Legacy LLC", countryCode: "US", tradingNames: null, validTo: new Date() }];

describe("buildSourcePartyAliasProposals", () => {
  it("proposes a retained source party against an active master with a review-required no-merge boundary", () => {
    const proposals = buildSourcePartyAliasProposals({ message: { supplier: "Meridian Export" } }, masters);
    expect(proposals).toEqual([expect.objectContaining({ sourceName: "Meridian Export", master: { id: 1, legalName: "Meridian Export House LLC", countryCode: "US" }, confidence: 0.92, disposition: "review_required", outcome: "no_merge" })]);
  });
  it("excludes weak, unrelated, email-like, and inactive master matches", () => {
    expect(buildSourcePartyAliasProposals({ seller: "Meridian", contact: "sales@meridian.example", buyer: "Eastern Retail" }, masters)).toEqual([]);
  });
});
