import type { ISODate } from "@/lib/dates";

export type { ISODate, ISOMonth } from "@/lib/dates";

export type ID = string;

export interface DateRange {
  from: ISODate;
  to: ISODate;
}

/**
 * Where a value comes from. The UI uses this to visibly distinguish recorded
 * business data from derived numbers and from simulated "intelligence".
 */
export type Provenance = "recorded" | "calculated" | "simulated";

export interface DatasetMeta {
  businessName: string;
  /** The date all "current" figures are computed against. */
  asOf: ISODate;
  historyStart: ISODate;
  currency: "INR";
  /** "dummy" while the UI runs on /dummy-data; "api" once a backend is wired. */
  source: "dummy" | "api";
}

/** A reference from one record to another, used in activity feeds & ledgers. */
export interface EntityRef {
  kind: "product" | "vendor" | "customer" | "purchase" | "bill" | "category" | "brand" | "offer" | "coupon" | "adjustment" | "receivable";
  id: ID;
  label: string;
}
