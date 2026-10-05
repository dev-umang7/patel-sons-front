"use server";

import { intelligenceRepository } from "@/data-access";
import type { GiftRecommendation } from "@/data-access/types";
import type { ActionResult } from "@/features/inventory/schemas";
import { giftRequestSchema, type GiftRequestInput } from "./schemas";

export async function getGiftRecommendations(input: GiftRequestInput): Promise<{ ok: true; result: GiftRecommendation } | { ok: false; message: string }> {
  const parsed = giftRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the inputs" };
  return { ok: true, result: await intelligenceRepository.recommendGifts(parsed.data) };
}

export async function createGiftBillDraft(productIds: string[], quantity: number): Promise<ActionResult> {
  if (productIds.length === 0 || quantity < 1) return { ok: false, message: "Choose at least one product", demo: true };
  return { ok: true, message: `Gift bill draft prepared · ${productIds.length} product${productIds.length > 1 ? "s" : ""} × ${quantity}`, demo: true };
}
