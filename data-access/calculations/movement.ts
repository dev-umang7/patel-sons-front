import { MARGIN_RULES, MOVEMENT_RULES } from "../rules/assumptions";
import type { MovementClass } from "../types/inventory";

export interface MovementInput {
  stockOnHand: number;
  unitsSoldInWindow: number;
  daysSinceLastSale: number | null;
}

export interface MovementMetrics {
  dailyVelocity: number;
  /** Days the current stock lasts at recent velocity; null when nothing sells. */
  daysOfCover: number | null;
  movement: MovementClass;
}

/** CALCULATED — thresholds are ASSUMPTIONS in rules/assumptions.ts. */
export function measureMovement(input: MovementInput): MovementMetrics {
  const dailyVelocity = input.unitsSoldInWindow / MOVEMENT_RULES.velocityWindowDays;
  const daysOfCover = dailyVelocity > 0 ? input.stockOnHand / dailyVelocity : null;
  return { dailyVelocity, daysOfCover, movement: classify(input, daysOfCover) };
}

function classify(input: MovementInput, cover: number | null): MovementClass {
  const hasStock = input.stockOnHand > 0;
  if (hasStock) {
    const stale = input.daysSinceLastSale === null || input.daysSinceLastSale >= MOVEMENT_RULES.deadNoSaleDays;
    if (stale || cover === null || cover >= MOVEMENT_RULES.deadMinCoverDays) return "dead";
    if (cover >= MOVEMENT_RULES.slowMinCoverDays) return "slow";
  }
  if (input.unitsSoldInWindow >= MOVEMENT_RULES.fastMinUnits && (cover === null || cover <= MOVEMENT_RULES.fastMaxCoverDays)) {
    return "fast";
  }
  return "normal";
}

export function marginPercent(sellingPrice: number, unitCost: number): number {
  if (sellingPrice <= 0) return 0;
  return ((sellingPrice - unitCost) / sellingPrice) * 100;
}

export function isLowMargin(margin: number): boolean {
  return margin < MARGIN_RULES.lowMarginPercent;
}

export const MOVEMENT_ORDER: Record<MovementClass, number> = { fast: 0, normal: 1, slow: 2, dead: 3 };
