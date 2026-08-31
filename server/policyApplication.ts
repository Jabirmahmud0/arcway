export type PolicyCondition = Record<string, unknown>;

export type PolicyApplicationInput = {
  trade: {
    buyerName: string;
    sellerName: string;
    buyerCountry: string;
    sellerCountry: string;
    originCountry: string;
    destinationCountry: string;
    incoterm: string;
  };
  paymentMethod?: string;
  productIds: number[];
  bindings: Array<{
    id: number;
    policyPackId: number;
    policyName: string;
    policyVersionId: number;
    policyVersion: number;
    rules: unknown;
    jurisdiction: string | null;
    counterpartyId: number | null;
    counterpartyName: string | null;
    productId: number | null;
    relationshipRole: "buyer" | "supplier" | "forwarder" | "carrier" | "bank" | "inspector" | "any";
    template: {
      id: number;
      name: string;
      actor: string;
      action: string;
      evidenceRequirement: string | null;
      criticality: "critical" | "warning" | "information";
      dueOffsetHours: number | null;
      releaseCondition: unknown;
    };
  }>;
  existingSources: string[];
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function matchesValue(actual: unknown, expected: unknown) {
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  return expectedValues.some(value => normalize(value) === normalize(actual));
}

function ruleContext(input: PolicyApplicationInput) {
  return {
    payment_method: input.paymentMethod,
    paymentMethod: input.paymentMethod,
    buyer: input.trade.buyerName,
    supplier: input.trade.sellerName,
    seller: input.trade.sellerName,
    buyer_country: input.trade.buyerCountry,
    seller_country: input.trade.sellerCountry,
    origin: input.trade.originCountry,
    origin_country: input.trade.originCountry,
    destination: input.trade.destinationCountry,
    destination_country: input.trade.destinationCountry,
    incoterm: input.trade.incoterm,
  } satisfies Record<string, unknown>;
}

function matchesRule(condition: PolicyCondition, input: PolicyApplicationInput) {
  const context: Record<string, unknown> = ruleContext(input);
  return Object.entries(condition).every(([key, expected]) => {
    if (key === "product_id" || key === "productId") return input.productIds.some(id => matchesValue(id, expected));
    if (!(key in context)) return false;
    return matchesValue(context[key], expected);
  });
}

function relationshipMatches(binding: PolicyApplicationInput["bindings"][number], input: PolicyApplicationInput) {
  if (binding.productId && !input.productIds.includes(binding.productId)) return false;
  if (!binding.counterpartyId) return true;
  if (!binding.counterpartyName) return false;
  const name = normalize(binding.counterpartyName);
  if (binding.relationshipRole === "buyer") return name === normalize(input.trade.buyerName);
  if (binding.relationshipRole === "supplier") return name === normalize(input.trade.sellerName);
  return name === normalize(input.trade.buyerName) || name === normalize(input.trade.sellerName);
}

function policyMatches(binding: PolicyApplicationInput["bindings"][number], input: PolicyApplicationInput) {
  const rules = Array.isArray(binding.rules) ? binding.rules : [];
  if (!rules.length) return true;
  return rules.some(rule => {
    if (!rule || typeof rule !== "object") return false;
    const condition = (rule as { if?: unknown }).if;
    return condition && typeof condition === "object" && !Array.isArray(condition) && matchesRule(condition as PolicyCondition, input);
  });
}

export function buildPolicyObligationPreview(input: PolicyApplicationInput) {
  return input.bindings.map(binding => {
    const source = `policy_binding:${binding.id}:policy_version:${binding.policyVersionId}`;
    const relationshipMatch = relationshipMatches(binding, input);
    const ruleMatch = relationshipMatch && policyMatches(binding, input);
    const alreadyApplied = input.existingSources.includes(source);
    const reasons = [
      relationshipMatch ? "Relationship and master-data scope matches this Trade Twin." : "The bound counterparty or product does not match this Trade Twin.",
      ruleMatch ? `Active policy v${binding.policyVersion} conditions match retained Trade Twin facts.` : "No active rule condition matched the retained Trade Twin facts.",
    ];
    return {
      bindingId: binding.id,
      source,
      eligible: ruleMatch && !alreadyApplied,
      alreadyApplied,
      policy: { id: binding.policyPackId, name: binding.policyName, versionId: binding.policyVersionId, version: binding.policyVersion, jurisdiction: binding.jurisdiction },
      relationship: { role: binding.relationshipRole, counterpartyName: binding.counterpartyName, productId: binding.productId },
      template: binding.template,
      reasons,
      boundary: "This is deterministic assistance based on retained workspace data and configured rules. It does not certify legal, regulatory, banking, or trade compliance.",
    };
  });
}
