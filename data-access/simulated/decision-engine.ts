/**
 * SIMULATED inventory decision support (KEEP / REPLACE / REVIEW / ELIMINATE).
 * Transparent rules over calculated metrics — not a trained model. Replace with
 * the real engine/API when available; the output shape stays the same.
 */
import { formatCurrencyCompact, formatDays, formatRelativeDays } from "@/lib/format";
import type { DecisionRecommendation, InventoryItem, SlowMovingAction } from "../types/views";

const FESTIVE_OCCASIONS = new Set(["diwali", "wedding", "pooja"]);
const LONG_HELD_DAYS = 180;

export function recommendDecision(item: InventoryItem, peers: InventoryItem[]): DecisionRecommendation {
  const reasons: string[] = [];
  const festive = item.giftOccasions.some((o) => FESTIVE_OCCASIONS.has(o));
  const replacement = findReplacement(item, peers);
  const tiedUp = formatCurrencyCompact(item.stockValue);

  if (item.daysSinceLastSale !== null) reasons.push(`Last sold ${formatRelativeDays(item.daysSinceLastSale)}`);
  else reasons.push("No sale recorded in the last 12 months");

  if (item.movement === "dead") {
    reasons.push(`${tiedUp} tied up in ${item.stockOnHand} units`);
    if (item.avgStockAgeDays !== null) reasons.push(`Stock held for ~${formatDays(item.avgStockAgeDays)} on average`);
    if (item.status === "discontinued") {
      return rec("eliminate", "high", "Clear remaining stock and stop re-ordering", reasons, ["create-offer", "gift-selection", "eliminate"]);
    }
    if (item.giftable) {
      reasons.push("Giftable — can move through gift selection / gift bills");
      return rec("review", "medium", "Move through gift selection before deciding", reasons, ["gift-selection", "create-offer", "eliminate"], replacement);
    }
    if ((item.avgStockAgeDays ?? 0) > LONG_HELD_DAYS || item.lowMargin) {
      return rec("eliminate", "medium", "Clear with an offer and drop from the range", reasons, ["create-offer", "eliminate"], replacement);
    }
    return rec("replace", "medium", "Replace with a faster-moving line in the category", reasons, ["create-offer", "replace"], replacement);
  }

  if (item.movement === "slow") {
    reasons.push(item.daysOfCover !== null ? `${Math.round(item.daysOfCover)} days of cover at current sales` : "No recent sales");
    if (festive) {
      reasons.push("Festive-season product — demand may pick up");
      return rec("review", "medium", "Hold through the festive season, then re-assess", reasons, ["mark-review", "gift-selection"]);
    }
    if (item.marginPercent >= 30) {
      reasons.push(`Healthy margin (${Math.round(item.marginPercent)}%) leaves room for an offer`);
      return rec("review", "medium", "Run a targeted offer before re-ordering", reasons, ["create-offer", "gift-selection", "mark-review"]);
    }
    return rec("replace", "low", "Consider replacing at next purchase", reasons, ["mark-review", "replace"], replacement);
  }

  if (item.movement === "fast") {
    reasons.push(`${item.unitsSold90} units sold in 90 days`);
    if (item.lowStock) reasons.push(`Stock (${item.stockOnHand}) at or below re-order level (${item.reorderLevel})`);
    if (item.lowMargin) reasons.push(`Margin ${Math.round(item.marginPercent)}% is below target — review buying price`);
    return rec("keep", "high", item.lowStock ? "Keep — re-order before stock-out" : "Keep — core fast mover", reasons, []);
  }

  reasons.push(`${item.unitsSold90} units sold in 90 days`);
  if (item.lowMargin) {
    reasons.push(`Margin ${Math.round(item.marginPercent)}% is below target`);
    return rec("review", "low", "Keep, but renegotiate the buying price", reasons, ["mark-review"]);
  }
  return rec("keep", "medium", "Keep — steady seller", reasons, []);
}

function rec(
  decision: DecisionRecommendation["decision"],
  confidence: DecisionRecommendation["confidence"],
  headline: string,
  reasons: string[],
  actions: SlowMovingAction[],
  replacement?: DecisionRecommendation["replacement"],
): DecisionRecommendation {
  return { provenance: "simulated", decision, confidence, headline, reasons, actions, replacement: decision === "replace" || decision === "eliminate" ? replacement : undefined };
}

function findReplacement(item: InventoryItem, peers: InventoryItem[]): DecisionRecommendation["replacement"] {
  const candidates = peers
    .filter((p) => p.categoryId === item.categoryId && p.productId !== item.productId && (p.movement === "fast" || p.movement === "normal"))
    .sort((a, b) => b.unitsSold90 - a.unitsSold90);
  const best = candidates.find((p) => Math.abs(p.sellingPrice - item.sellingPrice) / item.sellingPrice < 0.6) ?? candidates[0];
  if (!best) return undefined;
  return { productId: best.productId, name: best.name, reason: `${best.unitsSold90} units sold in 90 days in the same category` };
}
