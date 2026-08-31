export function applyStructuredFieldMapping(rows: Array<Record<string, unknown>>, mapping: Record<string, string>) {
  return rows.map(row => Object.fromEntries(Object.entries(mapping).map(([sourceField, canonicalField]) => [canonicalField, row[sourceField] ?? null])));
}

export function readMappedFieldForConfirmation(rows: Array<Record<string, unknown>>, rowIndex: number, fieldName: string) {
  const value = rows[rowIndex]?.[fieldName];
  return value === undefined || value === null || String(value).trim() === "" ? null : String(value);
}
