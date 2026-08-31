import * as XLSX from "xlsx";

export function parseStructuredSpreadsheet(buffer: Buffer) {
  if (!buffer.length) throw new Error("The structured file is empty.");
  const workbook = XLSX.read(buffer, { type: "buffer" }); const sheetName = workbook.SheetNames[0];
  if (!sheetName || !workbook.Sheets[sheetName]) throw new Error("No readable worksheet was found.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });
  return { sheetName, sheetCount: workbook.SheetNames.length, rowCount: rows.length, columns: rows.length ? Object.keys(rows[0]) : [], preview: rows.slice(0, 10) };
}
