import type { ID, ISODate, ISOMonth } from "./common";

export type VendorType = "distributor" | "wholesaler" | "brand-direct" | "manufacturer";

export interface Vendor {
  id: ID;
  name: string;
  type: VendorType;
  city: string;
  state: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  paymentTermsDays: number;
  leadTimeDays: number;
  since: ISODate;
  brandIds: ID[];
}

/** A vendor's current quoted price for a product — one "source" in Price Comparison. */
export interface SourceQuote {
  id: ID;
  productId: ID;
  vendorId: ID;
  unitCost: number;
  minOrderQty: number;
  leadTimeDays: number;
  quotedOn: ISODate;
  validUntil: ISODate;
}

/** Monthly vendor price observation — the basis of purchase price history. */
export interface CostObservation {
  productId: ID;
  vendorId: ID;
  month: ISOMonth;
  unitCost: number;
}

export type OfferType = "festive" | "volume" | "scheme" | "clearance" | "launch";

export type OfferBenefit =
  | { kind: "percent"; value: number }
  | { kind: "flat-per-unit"; value: number }
  | { kind: "free-units"; buy: number; free: number };

/**
 * A vendor/brand offer on purchases. How offers stack or apply in practice is an
 * OPEN QUESTION — the model records the terms as stated by the vendor.
 */
export interface VendorOffer {
  id: ID;
  vendorId: ID;
  title: string;
  type: OfferType;
  festival?: string;
  description: string;
  productIds: ID[];
  benefit: OfferBenefit;
  minQty?: number;
  startsOn: ISODate;
  endsOn: ISODate;
  terms?: string;
}

export type PurchaseStatus = "draft" | "ordered" | "partially-received" | "received" | "cancelled";

export interface PurchaseItem {
  productId: ID;
  quantity: number;
  /** Effective unit cost after any applied vendor offer. */
  unitCost: number;
  /** Unit cost before the offer, for savings reporting. */
  listUnitCost: number;
  receivedQuantity: number;
  /** Vendor offer applied to this line, if any. */
  offerId?: ID;
}

/** A goods receipt (GRN line): stock physically received against a purchase. */
export interface PurchaseReceipt {
  date: ISODate;
  productId: ID;
  quantity: number;
}

/**
 * A purchase moves through draft → ordered → (partially-)received.
 * "Purchase Orders" are the open part of this lifecycle; "Purchases" the received part.
 */
export interface Purchase {
  id: ID;
  number: string;
  vendorId: ID;
  status: PurchaseStatus;
  orderedOn: ISODate;
  expectedOn: ISODate;
  receivedOn?: ISODate;
  items: PurchaseItem[];
  receipts: PurchaseReceipt[];
  notes?: string;
}
