const CRON_FIELD = /^(?:\*|\d+(?:-\d+)?)(?:[\/,](?:\*|\d+(?:-\d+)?))*$/;

/** Validates a UTC cron shape without attempting to interpret provider-specific ranges. */
export function isValidSixFieldUtcCron(expression: string) {
  const fields = expression.trim().split(/\s+/);
  return fields.length === 6 && fields.every(field => CRON_FIELD.test(field));
}
