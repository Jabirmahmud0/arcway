import { describe, expect, it } from "vitest";
import { isValidSixFieldUtcCron } from "./operationalSchedule";

describe("ARCWAY operational schedule expression validation", () => {
  it("accepts the hourly six-field UTC schedule shown in Monitoring Center", () => {
    expect(isValidSixFieldUtcCron("0 0 * * * *")).toBe(true);
  });

  it("accepts bounded step syntax and rejects malformed or non-six-field values", () => {
    expect(isValidSixFieldUtcCron("0 */15 * * * *")).toBe(true);
    expect(isValidSixFieldUtcCron("0 0 * * *")).toBe(false);
    expect(isValidSixFieldUtcCron("every hour")).toBe(false);
  });
});
