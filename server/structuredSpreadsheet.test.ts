import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseStructuredSpreadsheet } from "./structuredSpreadsheet";

describe("ARCWAY structured spreadsheet normalization", () => {
  it("normalizes CSV header and bounded preview metadata", () => {
    const parsed = parseStructuredSpreadsheet(Buffer.from("Invoice,Quantity\nINV-1,10\nINV-2,20"));
    expect(parsed).toMatchObject({ sheetCount: 1, rowCount: 2, columns: ["Invoice", "Quantity"] });
    expect(parsed.preview).toEqual(expect.arrayContaining([{ Invoice: "INV-1", Quantity: 10 }]));
  });

  it("normalizes the first readable worksheet from an XLSX payload", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([{ "Invoice Ref": "INV-XLSX-1", Quantity: 12 }]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Commercial Invoice");
    const payload = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    expect(parseStructuredSpreadsheet(payload)).toMatchObject({
      sheetName: "Commercial Invoice",
      sheetCount: 1,
      rowCount: 1,
      columns: ["Invoice Ref", "Quantity"],
      preview: [{ "Invoice Ref": "INV-XLSX-1", Quantity: 12 }],
    });
  });

  it("rejects an empty structured file before canonical review", () => {
    expect(() => parseStructuredSpreadsheet(Buffer.alloc(0))).toThrow("empty");
  });
});
