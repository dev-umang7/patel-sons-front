"use server";

import type { ActionResult } from "@/features/inventory/schemas";
import { purchaseOrderSchema, type PurchaseOrderInput } from "./schemas";

/** Validated on the server; persisted once the backend exists (flagged demo until then). */
export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<ActionResult> {
  const parsed = purchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid purchase order", demo: true };
  const units = parsed.data.lines.reduce((a, l) => a + l.quantity, 0);
  return { ok: true, message: `Draft purchase order created · ${units} units`, demo: true };
}
