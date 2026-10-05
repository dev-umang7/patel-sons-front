import type { ID, ISODate } from "./common";

export type PaymentMode = "cash" | "upi" | "card" | "credit";

/**
 * "standard" or "gift". The exact meaning of a Gift Bill in the source notes
 * ("acquire non-fast item into Gift Bills") is an OPEN QUESTION; the flag only
 * records that a bill was raised as a gift bill.
 */
export type BillKind = "standard" | "gift";

export interface BillItem {
  productId: ID;
  quantity: number;
  unitPrice: number;
  /** Cost snapshot at time of sale, used for margin & profit. */
  unitCost: number;
  /** Line-level discount amount (₹). */
  discount: number;
}

export interface Bill {
  id: ID;
  number: string;
  date: ISODate;
  /** null for walk-in customers. */
  customerId: ID | null;
  items: BillItem[];
  couponId?: ID;
  couponDiscount: number;
  pointsRedeemed: number;
  paymentMode: PaymentMode;
  kind: BillKind;
}

/** Amount owed on a credit bill. */
export interface Receivable {
  id: ID;
  customerId: ID;
  billId: ID;
  amount: number;
  issuedOn: ISODate;
  dueOn: ISODate;
}

export type CollectionMode = "cash" | "upi" | "cheque" | "bank-transfer";

export interface CollectionPayment {
  id: ID;
  receivableId: ID;
  customerId: ID;
  date: ISODate;
  amount: number;
  mode: CollectionMode;
}

export type FollowUpChannel = "call" | "visit" | "message";

export interface CollectionNote {
  id: ID;
  receivableId: ID;
  date: ISODate;
  channel: FollowUpChannel;
  note: string;
  promisedOn?: ISODate;
}
