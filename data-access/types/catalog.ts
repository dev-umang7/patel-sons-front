import type { ID, ISODate } from "./common";

export interface Category {
  id: ID;
  slug: string;
  name: string;
  description: string;
}

export interface Brand {
  id: ID;
  slug: string;
  name: string;
  description: string;
}

export type ProductStatus = "active" | "under-review" | "discontinued";

export type ProductUnit = "pc" | "set" | "pack";

/**
 * Occasions a product is considered suitable for in Gift Selection.
 * Catalogue tagging is recorded data; how it is used to recommend is simulated.
 */
export type GiftOccasion =
  | "diwali"
  | "wedding"
  | "housewarming"
  | "birthday"
  | "corporate"
  | "anniversary"
  | "pooja";

export interface Product {
  id: ID;
  sku: string;
  name: string;
  categoryId: ID;
  brandId: ID;
  unit: ProductUnit;
  /** Current maximum retail price (GST inclusive). */
  mrp: number;
  /** Current shelf selling price (GST inclusive). */
  sellingPrice: number;
  hsn: string;
  gstRate: number;
  status: ProductStatus;
  /** Stock level at which the product should be considered for re-purchase. */
  reorderLevel: number;
  giftable: boolean;
  giftOccasions: GiftOccasion[];
  introducedOn: ISODate;
  description: string;
  attributes: Record<string, string>;
}

/** A change to a product's selling price / MRP, effective from a date. */
export interface PriceRevision {
  id: ID;
  productId: ID;
  effectiveFrom: ISODate;
  sellingPrice: number;
  mrp: number;
  note: string;
}
