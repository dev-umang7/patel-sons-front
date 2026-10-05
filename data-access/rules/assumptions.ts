/**
 * ASSUMPTIONS — every threshold the UI relies on that is NOT a confirmed
 * Patel & Sons business rule lives here, so each can be replaced in one place
 * once management confirms the real policy. Mirrors .strach/BUSINESS_RULES.md.
 */

export const MOVEMENT_RULES = {
  /** Sales window used to measure velocity. */
  velocityWindowDays: 90,
  /** Days of stock cover at or below which an item is "fast". */
  fastMaxCoverDays: 45,
  /** Minimum units sold in the window for an item to be "fast". */
  fastMinUnits: 20,
  /** Days of cover above which an item is "slow". */
  slowMinCoverDays: 120,
  /** No sale for this many days → "dead / very slow" (when stock remains). */
  deadNoSaleDays: 75,
  /** Days of cover above which an item is "dead / very slow". */
  deadMinCoverDays: 365,
} as const;

export const STOCK_RULES = {
  /** Stock at or below reorder level counts as low stock. */
  lowStockUsesReorderLevel: true,
} as const;

export const MARGIN_RULES = {
  /** Gross margin % below which a product is flagged "low margin". */
  lowMarginPercent: 20,
  /** Default target gross margin % used by the simulated pricing tool. */
  defaultTargetMarginPercent: 28,
} as const;

export const OFFER_RULES = {
  /** An active offer ending within this many days is "expiring soon". */
  expiringSoonDays: 7,
} as const;

export const COLLECTION_RULES = {
  /** Receivables due within this many days are "due soon". */
  dueSoonDays: 7,
  /** Overdue by more than this many days → "critical". */
  criticalOverdueDays: 60,
} as const;

export const LOYALTY_RULES = {
  /** Spend window used to place customers in tiers. */
  tierWindowDays: 365,
} as const;

export const PRICE_COMPARISON_RULES = {
  /** A source within this % of the cheapest is considered competitive. */
  competitiveWithinPercent: 2,
} as const;
