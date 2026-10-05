"use server";

import type { ActionResult } from "@/features/inventory/schemas";
import { followUpSchema, paymentSchema, type FollowUpInput, type PaymentInput } from "./schemas";

/** Collection of debt — validated on the server; persistence arrives with the backend. */
export async function recordPayment(input: PaymentInput, outstanding: number): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid payment", demo: true };
  if (parsed.data.amount > outstanding) return { ok: false, message: "Amount is more than the outstanding balance", demo: true };
  return { ok: true, message: `Payment of ₹${parsed.data.amount.toLocaleString("en-IN")} recorded`, demo: true };
}

export async function logFollowUp(input: FollowUpInput): Promise<ActionResult> {
  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid note", demo: true };
  return { ok: true, message: "Follow-up logged", demo: true };
}
