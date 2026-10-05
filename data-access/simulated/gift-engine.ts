/**
 * SIMULATED Gift Selection. Scores in-stock products against budget, occasion,
 * category preference and (optionally) a preference for non-fast items, then
 * builds simple combinations. Rule-based — not a trained model.
 * How non-fast items should feed Gift Bills is an OPEN QUESTION.
 */
import { formatCurrency } from "@/lib/format";
import type { ID } from "../types/common";
import type { GiftCombination, GiftRecommendation, GiftRequest, GiftSuggestion, InventoryItem } from "../types/views";

const OCCASION_LABEL: Record<GiftRequest["occasion"], string> = {
  diwali: "Diwali",
  wedding: "weddings",
  housewarming: "housewarmings",
  birthday: "birthdays",
  corporate: "corporate gifting",
  anniversary: "anniversaries",
  pooja: "pooja",
};

export function recommendGifts(request: GiftRequest, items: InventoryItem[], alreadyBought: Set<ID>): GiftRecommendation {
  const pool = items.filter(
    (i) => i.status !== "discontinued" && i.stockOnHand > 0 && (request.categoryIds.length === 0 || request.categoryIds.includes(i.categoryId)),
  );

  const scored: GiftSuggestion[] = [];
  for (const item of pool) {
    if (item.sellingPrice > request.budgetPerGift * 1.05) continue;
    const reasons: string[] = [];
    let score = 0;

    const fit = item.sellingPrice / request.budgetPerGift;
    score += fit >= 0.7 ? 30 : fit >= 0.45 ? 20 : 8;
    if (fit >= 0.7) reasons.push(`Uses the budget well (${formatCurrency(item.sellingPrice)} of ${formatCurrency(request.budgetPerGift)})`);

    if (item.giftOccasions.includes(request.occasion)) {
      score += 35;
      reasons.push(`Tagged for ${OCCASION_LABEL[request.occasion]}`);
    } else if (item.giftable) {
      score += 12;
      reasons.push("General gifting product");
    }

    const enoughStock = item.stockOnHand >= request.quantity;
    score += enoughStock ? 15 : -20;
    reasons.push(enoughStock ? `${item.stockOnHand} in stock — covers ${request.quantity}` : `Only ${item.stockOnHand} in stock for ${request.quantity} needed`);

    if (request.preferNonFast && (item.movement === "slow" || item.movement === "dead")) {
      score += item.movement === "dead" ? 22 : 16;
      reasons.push(`Non-fast item (${item.movement}) — helps move ageing stock`);
    }
    if (request.boostProductIds?.includes(item.productId)) {
      score += 20;
      reasons.push("Sent here for clearance");
    }
    if (item.marginPercent >= 30) score += 5;
    if (alreadyBought.has(item.productId)) {
      score -= 25;
      reasons.push("Customer has bought this before");
    }

    if (score < 25) continue;
    scored.push({
      productId: item.productId,
      name: item.name,
      brandName: item.brandName,
      categoryName: item.categoryName,
      price: item.sellingPrice,
      stockOnHand: item.stockOnHand,
      enoughStock,
      movement: item.movement,
      marginPercent: item.marginPercent,
      score,
      suitability: score >= 75 ? "excellent" : score >= 55 ? "good" : "fair",
      reasons,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const suggestions = scored.slice(0, 8);

  return {
    provenance: "simulated",
    request,
    suggestions,
    combinations: buildCombinations(scored, request),
    consideredCount: pool.length,
    notes: [
      "Scores combine budget fit, occasion tags, stock cover and movement. Weights are illustrative.",
      request.preferNonFast ? "Non-fast items are boosted, per the gift-bill concept in the source notes." : "Non-fast preference is off.",
    ],
  };
}

function buildCombinations(scored: GiftSuggestion[], request: GiftRequest): GiftCombination[] {
  const candidates = scored.filter((s) => s.price <= request.budgetPerGift * 0.7 && s.enoughStock).slice(0, 14);
  const combos: (GiftCombination & { score: number })[] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      if (a.categoryName === b.categoryName) continue;
      const total = a.price + b.price;
      if (total > request.budgetPerGift * 1.05) continue;
      const nonFast = [a, b].filter((x) => x.movement === "slow" || x.movement === "dead").length;
      combos.push({
        productIds: [a.productId, b.productId],
        names: [a.name, b.name],
        total,
        withinBudget: total <= request.budgetPerGift,
        nonFastCount: nonFast,
        reason: `${a.categoryName} + ${b.categoryName}${nonFast > 0 ? ` · includes ${nonFast} non-fast item${nonFast > 1 ? "s" : ""}` : ""}`,
        score: a.score + b.score + (total / request.budgetPerGift) * 30,
      });
    }
  }
  return combos
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...c }) => c);
}
