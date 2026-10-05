import { diffDays } from "@/lib/dates";
import type { Purchase } from "../types/procurement";

export interface VendorPerformance {
  completedOrders: number;
  /** Share of completed orders fully received on or before the expected date. */
  onTimeRate: number | null;
  avgDelayDays: number | null;
  /** Received units ÷ ordered units across completed orders. */
  fillRate: number | null;
}

/** CALCULATED from purchase history. */
export function vendorPerformance(purchases: Purchase[]): VendorPerformance {
  const completed = purchases.filter((p) => p.status === "received" && p.receivedOn);
  if (completed.length === 0) return { completedOrders: 0, onTimeRate: null, avgDelayDays: null, fillRate: null };
  const delays = completed.map((p) => diffDays(p.expectedOn, p.receivedOn!));
  const onTime = delays.filter((d) => d <= 0).length;
  const ordered = completed.reduce((a, p) => a + p.items.reduce((b, i) => b + i.quantity, 0), 0);
  const received = completed.reduce((a, p) => a + p.items.reduce((b, i) => b + i.receivedQuantity, 0), 0);
  return {
    completedOrders: completed.length,
    onTimeRate: (onTime / completed.length) * 100,
    avgDelayDays: delays.reduce((a, d) => a + Math.max(0, d), 0) / completed.length,
    fillRate: ordered > 0 ? (received / ordered) * 100 : null,
  };
}

export function purchaseValue(p: Purchase): number {
  return p.items.reduce((a, i) => a + i.quantity * i.unitCost, 0);
}

export function receivedValue(p: Purchase): number {
  return p.items.reduce((a, i) => a + i.receivedQuantity * i.unitCost, 0);
}

export function purchaseSavings(p: Purchase): number {
  return p.items.reduce((a, i) => a + i.quantity * (i.listUnitCost - i.unitCost), 0);
}
