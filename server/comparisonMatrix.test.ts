import { describe, expect, it } from "vitest";
import { buildComparisonMatrix } from "../shared/comparisonMatrix";

describe("buildComparisonMatrix", () => {
  it("builds dynamic source columns and highlights retained disagreement", () => {
    const rows = buildComparisonMatrix([
      { id: 1, fieldName: "quantity", fieldValue: "24000", authority: "authoritative", sourceLocation: { fileName: "buyer-po.pdf" } },
      { id: 2, fieldName: "quantity", fieldValue: "23800", authority: "conflicting", sourceLocation: { fileName: "packing-list.pdf" } },
      { id: 3, fieldName: "incoterm", fieldValue: "FOB", authority: "authoritative", sourceLocation: { sourceType: "email_attachment" } },
    ]);

    expect(rows[0]).toMatchObject({ fieldName: "quantity", conflicting: true, values: ["24000", "23800"] });
    expect(rows[0].cells).toEqual(expect.arrayContaining([expect.objectContaining({ source: "buyer-po.pdf" }), expect.objectContaining({ source: "packing-list.pdf" })]));
  });
});
