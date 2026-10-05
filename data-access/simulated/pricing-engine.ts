/**
 * SIMULATED Price Composition Tool. A weighted blend of cost-plus, category
 * norm and current price, nudged by movement — every step is shown to the user
 * as a factor. Not a trained model; the exact pricing formula is an OPEN QUESTION.
 */
import { formatCurrency, formatPercent } from "@/lib/format";
import { MARGIN_RULES } from "../rules/assumptions";
import type { MovementClass } from "../types/inventory";
import type { Confidence, InventoryItem, PriceRecommendation, PricingFactor, SourceOption } from "../types/views";

const MOVEMENT_NUDGE: Record<MovementClass, number> = { fast: 0.03, normal: 0, slow: -0.05, dead: -0.1 };
const WEIGHTS = { costPlus: 0.4, category: 0.3, current: 0.3 };

export interface PricingInput {
  item: InventoryItem;
  sources: SourceOption[];
  purchaseCosts: number[];
  categoryName: string;
  categoryMarginPercent: number;
  previousPrice: number | null;
  targetMarginPercent?: number;
}

export function roundToRetail(x: number): number {
  if (x < 500) return Math.max(9, Math.round(x / 10) * 10 - 1);
  return Math.round(x / 50) * 50 - 1;
}

export function composePrice(input: PricingInput): PriceRecommendation {
  const { item, sources } = input;
  // Default target never sits below the category norm, so high-margin categories are not dragged down.
  const target = input.targetMarginPercent ?? Math.max(MARGIN_RULES.defaultTargetMarginPercent, Math.round(input.categoryMarginPercent));
  const live = sources.filter((s) => !s.quoteExpired);
  const best = live.length > 0 ? live.reduce((a, b) => (b.effectiveCost < a.effectiveCost ? b : a)) : null;
  const costBasis = Math.max(item.avgUnitCost, best?.effectiveCost ?? 0) || item.avgUnitCost;

  const costPlus = costBasis / (1 - target / 100);
  const categoryAnchor = costBasis / (1 - input.categoryMarginPercent / 100);
  const blended = WEIGHTS.costPlus * costPlus + WEIGHTS.category * categoryAnchor + WEIGHTS.current * item.sellingPrice;
  const nudged = blended * (1 + MOVEMENT_NUDGE[item.movement]);
  const recommended = Math.min(item.mrp, roundToRetail(nudged));
  const low = Math.min(item.mrp, roundToRetail(nudged * 0.96));
  const high = Math.min(item.mrp, roundToRetail(nudged * 1.04));

  const avgPaid = input.purchaseCosts.length > 0 ? input.purchaseCosts.reduce((a, b) => a + b, 0) / input.purchaseCosts.length : null;
  const lastPaid = item.lastPurchaseCost;
  const walkAway = Math.round(item.sellingPrice * (1 - MARGIN_RULES.lowMarginPercent / 100));
  const buyTarget = Math.round(Math.min(best?.effectiveCost ?? Infinity, (avgPaid ?? Infinity) * 0.98, walkAway));

  const dataPoints = live.length + Math.min(3, input.purchaseCosts.length) + (item.unitsSold90 >= 10 ? 2 : item.unitsSold90 > 0 ? 1 : 0);
  const sellConfidence: Confidence = dataPoints >= 6 ? "high" : dataPoints >= 4 ? "medium" : "low";
  const buyConfidence: Confidence = live.length >= 3 ? "high" : live.length === 2 ? "medium" : "low";

  const factors: PricingFactor[] = [
    { key: "cost", label: "Purchase cost basis", value: formatCurrency(costBasis), effect: "neutral", detail: `Higher of average stock cost (${formatCurrency(item.avgUnitCost)}) and best live quote${best ? ` (${formatCurrency(best.effectiveCost)})` : ""}.` },
    { key: "target", label: "Target margin", value: formatPercent(target, 0), effect: target > item.marginPercent ? "raise" : "lower", detail: `Cost-plus price at target margin: ${formatCurrency(costPlus)} (weight ${WEIGHTS.costPlus * 100}%).` },
    { key: "category", label: `${input.categoryName} margin`, value: formatPercent(input.categoryMarginPercent), effect: input.categoryMarginPercent > item.marginPercent ? "raise" : "lower", detail: `Category-norm price: ${formatCurrency(categoryAnchor)} (weight ${WEIGHTS.category * 100}%).` },
    { key: "current", label: "Current selling price", value: formatCurrency(item.sellingPrice), effect: "neutral", detail: `Anchors the recommendation to today's shelf price (weight ${WEIGHTS.current * 100}%).` },
    { key: "movement", label: "Movement", value: item.movement, effect: MOVEMENT_NUDGE[item.movement] > 0 ? "raise" : MOVEMENT_NUDGE[item.movement] < 0 ? "lower" : "neutral", detail: `${item.unitsSold90} units in 90 days → ${MOVEMENT_NUDGE[item.movement] >= 0 ? "+" : ""}${MOVEMENT_NUDGE[item.movement] * 100}% adjustment.` },
    { key: "stock", label: "Current stock", value: `${item.stockOnHand} units`, effect: item.daysOfCover !== null && item.daysOfCover > 120 ? "lower" : "neutral", detail: item.daysOfCover !== null ? `${Math.round(item.daysOfCover)} days of cover.` : "No recent sales to measure cover." },
    { key: "mrp", label: "MRP ceiling", value: formatCurrency(item.mrp), effect: nudged > item.mrp ? "lower" : "neutral", detail: "Recommendation is capped at MRP." },
  ];
  if (input.previousPrice !== null) {
    factors.push({ key: "history", label: "Previous selling price", value: formatCurrency(input.previousPrice), effect: "neutral", detail: "Shown for context; not weighted." });
  }

  const expectedMargin = ((recommended - costBasis) / recommended) * 100;
  const currentMargin = ((item.sellingPrice - costBasis) / item.sellingPrice) * 100;

  return {
    provenance: "simulated",
    method: "Weighted blend of cost-plus at target margin (40%), category-norm margin (30%) and current price (30%), adjusted for movement, rounded to retail price points and capped at MRP. The default target margin is the higher of 28% and the category norm.",
    sell: {
      current: item.sellingPrice,
      recommended,
      low,
      high,
      mrp: item.mrp,
      costBasis,
      expectedMarginPercent: expectedMargin,
      currentMarginPercent: currentMargin,
      changePercent: ((recommended - item.sellingPrice) / item.sellingPrice) * 100,
      confidence: sellConfidence,
      rationale:
        recommended > item.sellingPrice
          ? `Current price sits below the blended target; ${item.movement === "fast" ? "strong movement supports" : "costs support"} a modest increase.`
          : recommended < item.sellingPrice
            ? `${item.movement === "slow" || item.movement === "dead" ? "Slow movement" : "Cost position"} suggests a lower price would clear stock faster.`
            : "Current price is in line with the blended target.",
    },
    buy: {
      target: Number.isFinite(buyTarget) ? buyTarget : walkAway,
      walkAway,
      bestAvailable: best?.effectiveCost ?? null,
      bestVendorName: best?.vendorName ?? null,
      lastPaid,
      avgPaid: avgPaid !== null ? Math.round(avgPaid) : null,
      confidence: buyConfidence,
      rationale: best
        ? `Aim at or below the best live source (${best.vendorName}). Above ${formatCurrency(walkAway)} the margin falls under ${MARGIN_RULES.lowMarginPercent}%.`
        : `No live quotes — re-quote before purchasing. Above ${formatCurrency(walkAway)} the margin falls under ${MARGIN_RULES.lowMarginPercent}%.`,
    },
    factors,
    inputs: { targetMarginPercent: target, categoryMarginPercent: input.categoryMarginPercent },
  };
}
