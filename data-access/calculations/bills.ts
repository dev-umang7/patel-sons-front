import { sum } from "@/lib/utils";
import type { Bill, BillItem } from "../types/sales";

/** CALCULATED bill figures. Amounts are GST-inclusive (tax split is an OPEN QUESTION). */
export function lineGross(item: BillItem): number {
  return item.quantity * item.unitPrice;
}

export function lineNet(item: BillItem): number {
  return lineGross(item) - item.discount;
}

export function lineCost(item: BillItem): number {
  return item.quantity * item.unitCost;
}

export function billSubtotal(bill: Bill): number {
  return sum(bill.items, lineGross);
}

export function billDiscounts(bill: Bill): number {
  return sum(bill.items, (i) => i.discount) + bill.couponDiscount + bill.pointsRedeemed;
}

export function billNetTotal(bill: Bill): number {
  return billSubtotal(bill) - billDiscounts(bill);
}

export function billCost(bill: Bill): number {
  return sum(bill.items, lineCost);
}

export function billGrossProfit(bill: Bill): number {
  return billNetTotal(bill) - billCost(bill);
}

export function billUnits(bill: Bill): number {
  return sum(bill.items, (i) => i.quantity);
}

/**
 * Net revenue attributable to one line after spreading bill-level discounts
 * (coupon, points) proportionally across lines. Used for product/category reporting.
 */
export function lineNetAfterBillDiscounts(bill: Bill, item: BillItem): number {
  const subtotalNet = sum(bill.items, lineNet);
  if (subtotalNet <= 0) return 0;
  const billLevel = bill.couponDiscount + bill.pointsRedeemed;
  return lineNet(item) * (1 - billLevel / subtotalNet);
}
