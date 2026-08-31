import { describe, expect, it } from "vitest";
import { shouldEscalateSourceHealth } from "./alertPolicy";

describe("ARCWAY workflow alert policy", () => {
  const now = new Date("2030-01-02T12:00:00Z");
  it("honors reviewer disabled state and configured source-health threshold", () => {
    expect(shouldEscalateSourceHealth({ policy: { enabled: 0, threshold: 1 }, status: "degraded", lastSyncedAt: null, now })).toBe(false);
    expect(shouldEscalateSourceHealth({ policy: { enabled: 1, threshold: 4 }, status: "connected", lastSyncedAt: new Date("2030-01-02T09:00:00Z"), now })).toBe(false);
    expect(shouldEscalateSourceHealth({ policy: { enabled: 1, threshold: 2 }, status: "connected", lastSyncedAt: new Date("2030-01-02T09:00:00Z"), now })).toBe(true);
  });
  it("always treats degraded providers as eligible when the policy is enabled", () => {
    expect(shouldEscalateSourceHealth({ policy: { enabled: 1, threshold: 720 }, status: "degraded", lastSyncedAt: new Date("2030-01-02T12:00:00Z"), now })).toBe(true);
  });
});
