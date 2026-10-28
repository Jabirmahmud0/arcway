function parseField(value: string, min: number, max: number): number[] {
  const values = new Set<number>();
  for (const item of value.split(",")) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(item);
    if (!match) throw new Error("Invalid UTC cron field");
    const step = Number(match[2] ?? 1);
    const [start, end] = match[1] === "*" ? [min, max] : match[1].includes("-")
      ? match[1].split("-").map(Number) : [Number(match[1]), match[2] ? max : Number(match[1])];
    if (step < 1 || step > max + 1 || start < min || end > max || start > end) throw new Error("UTC cron field out of range");
    for (let n = start; n <= end; n += step) values.add(n);
  }
  return Array.from(values).sort((a, b) => a - b);
}

function parse(expression: string) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 6) throw new Error("Use a six-field UTC cron expression");
  const ranges = [[0, 59], [0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
  return { parts, values: parts.map((part, i) => parseField(part, ranges[i][0], ranges[i][1])) };
}

export function isValidSixFieldUtcCron(expression: string) {
  try { parse(expression); return true; } catch { return false; }
}

/** Strictly after `after`, with cron OR semantics for restricted day fields. */
export function nextUtcExecution(expression: string, after: Date): Date | null {
  const { parts, values: [seconds, minutes, hours, days, months, weekdays] } = parse(expression);
  const start = new Date(after);
  start.setUTCHours(0, 0, 0, 0);
  for (let offset = 0; offset < 366 * 8; offset++) {
    const day = new Date(start.getTime() + offset * 86_400_000);
    if (!months.includes(day.getUTCMonth() + 1)) continue;
    const dom = days.includes(day.getUTCDate());
    const dow = weekdays.some(n => n % 7 === day.getUTCDay());
    const bothRestricted = !parts[3].startsWith("*") && !parts[5].startsWith("*");
    if (!(bothRestricted ? dom || dow : dom && dow)) continue;
    for (const hour of hours) {
      if (!offset && hour < after.getUTCHours()) continue;
      for (const minute of minutes) {
        if (!offset && hour === after.getUTCHours() && minute < after.getUTCMinutes()) continue;
        for (const second of seconds) {
          const time = new Date(day.getTime() + hour * 3_600_000 + minute * 60_000 + second * 1000);
          if (time > after) return time;
        }
      }
    }
  }
  return null;
}

export function startOperationalScheduler(run: () => Promise<unknown>, intervalMs = 5000) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await run(); } catch { console.error("[Scheduler] Operational sweep failed; retrying on the next tick."); }
    finally { running = false; }
  };
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}
