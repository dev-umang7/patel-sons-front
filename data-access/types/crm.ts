import type { ID, ISODate } from "./common";

export type CustomerType = "individual" | "business";

export interface Customer {
  id: ID;
  name: string;
  businessName?: string;
  type: CustomerType;
  phone: string;
  email?: string;
  area: string;
  city: string;
  joinedOn: ISODate;
  /** Credit period offered to this customer, when credit is extended. */
  creditDays?: number;
  notes?: string;
}

/** Loyalty tiers. Thresholds are an ASSUMPTION until confirmed (see BUSINESS_RULES.md). */
export interface LoyaltyTier {
  id: ID;
  name: string;
  /** Minimum trailing-12-month spend to qualify. */
  minAnnualSpend: number;
  benefits: string[];
}

export type LoyaltyEntryKind = "earned" | "redeemed" | "adjusted";

export interface LoyaltyEntry {
  id: ID;
  customerId: ID;
  date: ISODate;
  points: number;
  kind: LoyaltyEntryKind;
  billId?: ID;
  note: string;
}

export type CouponSegment = "all" | "loyalty-members" | "gold-and-above" | "business";

export type CouponSchedule =
  | { kind: "dates"; dates: ISODate[] }
  | { kind: "weekly"; weekdays: number[]; from: ISODate; to: ISODate };

export type CouponDiscount =
  | { kind: "percent"; value: number; maxDiscount?: number }
  | { kind: "flat"; value: number };

/** Day-specific coupon. Usage is derived from bills that reference the coupon. */
export interface Coupon {
  id: ID;
  code: string;
  title: string;
  description: string;
  schedule: CouponSchedule;
  discount: CouponDiscount;
  minBillAmount: number;
  segment: CouponSegment;
  /** Restrict to categories; empty = whole bill. */
  categoryIds: ID[];
  usageLimit?: number;
  campaignId?: ID;
  paused?: boolean;
}

export interface Campaign {
  id: ID;
  name: string;
  occasion: string;
  startsOn: ISODate;
  endsOn: ISODate;
  description: string;
}
