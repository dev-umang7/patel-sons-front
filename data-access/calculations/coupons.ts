import { weekdayOf, type ISODate } from "@/lib/dates";
import type { Coupon } from "../types/crm";

export type CouponStatus = "scheduled" | "live-today" | "active" | "ended" | "paused";

export function couponValidOn(coupon: Coupon, date: ISODate): boolean {
  const s = coupon.schedule;
  if (s.kind === "dates") return s.dates.includes(date);
  return date >= s.from && date <= s.to && s.weekdays.includes(weekdayOf(date));
}

export function couponWindow(coupon: Coupon): { from: ISODate; to: ISODate } {
  const s = coupon.schedule;
  if (s.kind === "dates") {
    const sorted = [...s.dates].sort();
    return { from: sorted[0], to: sorted[sorted.length - 1] };
  }
  return { from: s.from, to: s.to };
}

export function couponStatus(coupon: Coupon, asOf: ISODate): CouponStatus {
  if (coupon.paused) return "paused";
  const { from, to } = couponWindow(coupon);
  if (asOf < from) return "scheduled";
  if (asOf > to) return "ended";
  return couponValidOn(coupon, asOf) ? "live-today" : "active";
}

/** Discount amount for an eligible subtotal, honouring caps. CALCULATED. */
export function couponDiscountFor(coupon: Coupon, eligibleSubtotal: number): number {
  if (eligibleSubtotal < coupon.minBillAmount) return 0;
  const d = coupon.discount;
  if (d.kind === "flat") return Math.min(d.value, eligibleSubtotal);
  const raw = (eligibleSubtotal * d.value) / 100;
  return Math.round(d.maxDiscount ? Math.min(raw, d.maxDiscount) : raw);
}

export function describeCouponDiscount(coupon: Coupon): string {
  const d = coupon.discount;
  if (d.kind === "flat") return `₹${d.value.toLocaleString("en-IN")} off`;
  return d.maxDiscount ? `${d.value}% off · up to ₹${d.maxDiscount.toLocaleString("en-IN")}` : `${d.value}% off`;
}

export const COUPON_SEGMENT_LABEL: Record<Coupon["segment"], string> = {
  all: "All customers",
  "loyalty-members": "Loyalty members",
  "gold-and-above": "Gold & Platinum",
  business: "Business accounts",
};
