"use server";

import { clearanceOfferSchema, decisionSchema, type ActionResult, type ClearanceOfferInput, type DecisionInput } from "./schemas";

/**
 * Inventory decision actions. Validated on the server; persistence arrives with
 * the backend (until then results are flagged `demo: true`).
 */
export async function createClearanceOffer(input: ClearanceOfferInput): Promise<ActionResult> {
  const parsed = clearanceOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid offer", demo: true };
  return { ok: true, message: `${parsed.data.discountPercent}% offer scheduled`, demo: true };
}

export async function recordDecision(input: DecisionInput): Promise<ActionResult> {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose at least one product", demo: true };
  const n = parsed.data.productIds.length;
  const label = { keep: "kept", review: "marked for review", replace: "marked for replacement", eliminate: "marked for elimination" }[parsed.data.decision];
  return { ok: true, message: `${n} product${n > 1 ? "s" : ""} ${label}`, demo: true };
}
