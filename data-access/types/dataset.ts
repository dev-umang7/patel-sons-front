import type { Brand, Category, PriceRevision, Product } from "./catalog";
import type { DatasetMeta } from "./common";
import type { Campaign, Coupon, Customer, LoyaltyEntry, LoyaltyTier } from "./crm";
import type { Expense } from "./finance";
import type { OpeningStock, StockAdjustment } from "./inventory";
import type { CostObservation, Purchase, SourceQuote, Vendor, VendorOffer } from "./procurement";
import type { Bill, CollectionNote, CollectionPayment, Receivable } from "./sales";

/**
 * The complete set of recorded business records a provider exposes.
 * Everything else the UI shows is derived from these by the data-access layer.
 */
export interface Dataset {
  meta: DatasetMeta;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  priceRevisions: PriceRevision[];
  vendors: Vendor[];
  sourceQuotes: SourceQuote[];
  costObservations: CostObservation[];
  vendorOffers: VendorOffer[];
  purchases: Purchase[];
  openingStock: OpeningStock[];
  stockAdjustments: StockAdjustment[];
  customers: Customer[];
  bills: Bill[];
  receivables: Receivable[];
  collectionPayments: CollectionPayment[];
  collectionNotes: CollectionNote[];
  loyaltyTiers: LoyaltyTier[];
  loyaltyEntries: LoyaltyEntry[];
  coupons: Coupon[];
  campaigns: Campaign[];
  expenses: Expense[];
}
