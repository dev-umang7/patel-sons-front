import type { EntityRef, ID, ISODate } from "./common";

export type AdjustmentReason = "damaged" | "customer-return" | "vendor-return" | "stock-count";

export interface StockAdjustment {
  id: ID;
  productId: ID;
  date: ISODate;
  /** Signed: negative removes stock. */
  quantity: number;
  reason: AdjustmentReason;
  note: string;
}

export interface OpeningStock {
  productId: ID;
  asOf: ISODate;
  quantity: number;
  unitCost: number;
}

/** Calculated from sales velocity against thresholds in data-access/rules/assumptions.ts. */
export type MovementClass = "fast" | "normal" | "slow" | "dead";

export type StockMovementType = "opening" | "purchase" | "sale" | "adjustment";

export interface StockMovementEntry {
  id: ID;
  date: ISODate;
  productId: ID;
  type: StockMovementType;
  /** Signed quantity. */
  quantity: number;
  balanceAfter: number;
  reference: EntityRef;
}

/** KEEP / REPLACE / REVIEW / ELIMINATE — from the source notes' decision step. */
export type InventoryDecision = "keep" | "replace" | "review" | "eliminate";
