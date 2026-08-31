import { describe, expect, it } from "vitest";
import { providerCatalog, simulateProviderRun } from "./registry";

describe("provider adapter registry", () => {
  it("exposes each provider type exactly once with declared capabilities", () => {
    const types = providerCatalog.map(provider => provider.type);
    expect(new Set(types).size).toBe(types.length);
    expect(providerCatalog.every(provider => provider.capabilities.length > 0)).toBe(true);
  });

  it("normalizes a carrier run into an auditable external reference signal", () => {
    const signal = simulateProviderRun("carrier", "AR-28412");
    expect(signal.entityType).toBe("booking");
    expect(signal.externalId).toContain("AR-28412");
    expect(signal.output).toMatchObject({ event: "shipping_instruction_cutoff", atRisk: true });
  });
});
