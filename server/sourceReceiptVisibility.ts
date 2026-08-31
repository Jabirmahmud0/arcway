export type ReceiptRoutingResponse = { tradeId: number | null; routingContext: unknown };

export function redactRoutingContextForRole<T extends ReceiptRoutingResponse>(role: "trader" | "reviewer", receipt: T): T {
  if (role === "trader" && receipt.tradeId !== null) return { ...receipt, routingContext: null };
  return receipt;
}
