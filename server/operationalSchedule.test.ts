import { describe, expect, it } from "vitest";
import { isValidSixFieldUtcCron, nextUtcExecution, startOperationalScheduler } from "./operationalSchedule";
import { vi } from "vitest";

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

it("handles steps, month boundaries, leap years and Sunday aliases in UTC", () => {
  expect(nextUtcExecution("0 */15 * * * *", new Date("2026-10-29T23:59:59Z"))?.toISOString()).toBe("2026-10-30T00:00:00.000Z");
  expect(nextUtcExecution("0 0 0 29 2 *", new Date("2026-01-01T00:00:00Z"))?.toISOString()).toBe("2028-02-29T00:00:00.000Z");
  expect(nextUtcExecution("0 0 0 * * 7", new Date("2026-10-29T00:00:00Z"))?.getUTCDay()).toBe(0);
  expect(nextUtcExecution("0 0 0 31 2 *", new Date())).toBeNull();
  expect(isValidSixFieldUtcCron("0 */0 * * * *")).toBe(false);
  expect(isValidSixFieldUtcCron("0 0 24 * * *")).toBe(false);
});

it("does not overlap in-process ticks and stops cleanly", async () => {
  vi.useFakeTimers();
  let finish!: () => void;
  const run = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const stop = startOperationalScheduler(run, 100);
  await vi.advanceTimersByTimeAsync(500);
  expect(run).toHaveBeenCalledTimes(1);
  finish();
  await vi.advanceTimersByTimeAsync(100);
  expect(run).toHaveBeenCalledTimes(2);
  stop(); finish();
  await vi.advanceTimersByTimeAsync(500);
  expect(run).toHaveBeenCalledTimes(2);
  vi.useRealTimers();
});
