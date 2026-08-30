export type ComparisonEvidence = { id: number; fieldName: string; fieldValue: string; authority: string; sourceLocation: unknown; modelVersion?: string | null };
export type ComparisonCell = { source: string; value: string; authority: string; evidenceId: number };
export type ComparisonRow = { fieldName: string; cells: ComparisonCell[]; values: string[]; conflicting: boolean };

function sourceLabel(record: ComparisonEvidence) {
  if (record.sourceLocation && typeof record.sourceLocation === "object") {
    const location = record.sourceLocation as Record<string, unknown>;
    for (const key of ["documentType", "fileName", "sourceName", "sourceType"]) {
      const value = location[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return `${record.modelVersion || "retained evidence"} · evidence ${record.id}`;
}

export function buildComparisonMatrix(records: ComparisonEvidence[]): ComparisonRow[] {
  const grouped = new Map<string, ComparisonEvidence[]>();
  for (const record of records) grouped.set(record.fieldName, [...(grouped.get(record.fieldName) ?? []), record]);
  return Array.from(grouped.entries()).map(([fieldName, fields]: [string, ComparisonEvidence[]]) => {
    const cells = fields.map(field => ({ source: sourceLabel(field), value: field.fieldValue, authority: field.authority, evidenceId: field.id }));
    const values = Array.from(new Set(cells.map(cell => cell.value.trim()).filter(Boolean)));
    return { fieldName, cells, values, conflicting: fields.some(field => field.authority === "conflicting") || values.length > 1 };
  }).sort((left, right) => Number(right.conflicting) - Number(left.conflicting) || left.fieldName.localeCompare(right.fieldName));
}
