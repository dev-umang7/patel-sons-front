/**
 * View models — the shapes repositories return to the UI. A future API provider
 * must return these same shapes; the UI never sees raw dataset joins.
 */
import type { AgeingBucket, ReceivableStatus } from "../calculations/collections";
import type { CouponStatus } from "../calculations/coupons";
import type { OfferStatus } from "../calculations/offers";
import type { Brand, Category, GiftOccasion, PriceRevision, Product, ProductStatus, ProductUnit } from "./catalog";
import type { DateRange, EntityRef, ID, ISODate, ISOMonth } from "./common";
import type { Campaign, Coupon, Customer, CustomerType, LoyaltyEntry, LoyaltyTier } from "./crm";
import type { ExpenseCategory, Expense } from "./finance";
import type { InventoryDecision, MovementClass, StockMovementEntry } from "./inventory";
import type { OfferBenefit, OfferType, PurchaseStatus, Vendor, VendorOffer, VendorType } from "./procurement";
import type { BillKind, CollectionNote, CollectionPayment, PaymentMode } from "./sales";

/* ------------------------------------------------------------------ Inventory */

export interface InventoryItem {
  productId: ID;
  sku: string;
  name: string;
  categoryId: ID;
  categoryName: string;
  brandId: ID;
  brandName: string;
  status: ProductStatus;
  unit: ProductUnit;
  mrp: number;
  sellingPrice: number;
  avgUnitCost: number;
  marginPercent: number;
  stockOnHand: number;
  onOrder: number;
  reorderLevel: number;
  stockValue: number;
  retailValue: number;
  unitsSold30: number;
  unitsSold90: number;
  revenue90: number;
  dailyVelocity: number;
  daysOfCover: number | null;
  lastSaleOn: ISODate | null;
  daysSinceLastSale: number | null;
  lastPurchaseOn: ISODate | null;
  lastPurchaseCost: number | null;
  lastVendorId: ID | null;
  lastVendorName: string | null;
  avgStockAgeDays: number | null;
  oldestStockOn: ISODate | null;
  movement: MovementClass;
  lowStock: boolean;
  lowMargin: boolean;
  giftable: boolean;
  giftOccasions: GiftOccasion[];
  vendorIds: ID[];
}

export interface MovementBreakdown {
  movement: MovementClass;
  products: number;
  stockValue: number;
  units: number;
}

export interface InventoryOverview {
  totalProducts: number;
  stockUnits: number;
  stockValue: number;
  retailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  onOrderUnits: number;
  movement: MovementBreakdown[];
  byCategory: { categoryId: ID; categoryName: string; stockValue: number; units: number; slowValue: number }[];
  ageing: { bucket: "0-30" | "31-90" | "91-180" | "180+"; stockValue: number; units: number }[];
}

export interface StockMovementRow extends StockMovementEntry {
  productName: string;
  sku: string;
  categoryName: string;
}

/* ------------------------------------------------------------- Intelligence */

export type Confidence = "high" | "medium" | "low";

export type SlowMovingAction = "create-offer" | "gift-selection" | "mark-review" | "replace" | "eliminate";

/** SIMULATED — rule-based heuristics, not a trained model. */
export interface DecisionRecommendation {
  provenance: "simulated";
  decision: InventoryDecision;
  confidence: Confidence;
  headline: string;
  reasons: string[];
  actions: SlowMovingAction[];
  replacement?: { productId: ID; name: string; reason: string };
}

export interface DecisionItem extends InventoryItem {
  recommendation: DecisionRecommendation;
}

export type PricingFactorEffect = "raise" | "lower" | "neutral";

export interface PricingFactor {
  key: string;
  label: string;
  value: string;
  effect: PricingFactorEffect;
  detail: string;
}

/** SIMULATED price composition. */
export interface PriceRecommendation {
  provenance: "simulated";
  method: string;
  sell: {
    current: number;
    recommended: number;
    low: number;
    high: number;
    mrp: number;
    costBasis: number;
    expectedMarginPercent: number;
    currentMarginPercent: number;
    changePercent: number;
    confidence: Confidence;
    rationale: string;
  };
  buy: {
    target: number;
    walkAway: number;
    bestAvailable: number | null;
    bestVendorName: string | null;
    lastPaid: number | null;
    avgPaid: number | null;
    confidence: Confidence;
    rationale: string;
  };
  factors: PricingFactor[];
  inputs: { targetMarginPercent: number; categoryMarginPercent: number };
}

export interface GiftRequest {
  occasion: GiftOccasion;
  budgetPerGift: number;
  quantity: number;
  categoryIds: ID[];
  preferNonFast: boolean;
  customerId: ID | null;
  /** Products explicitly sent to gift selection (e.g. from Slow-moving) — ranked higher. */
  boostProductIds?: ID[];
}

/** A product whose simulated recommended price differs from today's price. */
export interface PricingOpportunity {
  productId: ID;
  name: string;
  categoryName: string;
  movement: MovementClass;
  current: number;
  recommended: number;
  changePercent: number;
  currentMarginPercent: number;
  expectedMarginPercent: number;
  confidence: Confidence;
}

export interface GiftSuggestion {
  productId: ID;
  name: string;
  brandName: string;
  categoryName: string;
  price: number;
  stockOnHand: number;
  enoughStock: boolean;
  movement: MovementClass;
  marginPercent: number;
  score: number;
  suitability: "excellent" | "good" | "fair";
  reasons: string[];
}

export interface GiftCombination {
  productIds: ID[];
  names: string[];
  total: number;
  withinBudget: boolean;
  nonFastCount: number;
  reason: string;
}

/** SIMULATED gift selection result. */
export interface GiftRecommendation {
  provenance: "simulated";
  request: GiftRequest;
  suggestions: GiftSuggestion[];
  combinations: GiftCombination[];
  consideredCount: number;
  notes: string[];
}

/* ------------------------------------------------------------- Procurement */

export interface SourceOption {
  quoteId: ID;
  vendorId: ID;
  vendorName: string;
  vendorType: VendorType;
  city: string;
  quotedCost: number;
  effectiveCost: number;
  minOrderQty: number;
  leadTimeDays: number;
  quotedOn: ISODate;
  validUntil: ISODate;
  quoteExpired: boolean;
  offer: { id: ID; title: string; benefit: OfferBenefit; benefitLabel: string; status: OfferStatus; minQty?: number; endsOn: ISODate } | null;
  lastPaidCost: number | null;
  lastPaidOn: ISODate | null;
  expectedMarginPercent: number;
  diffVsBestPercent: number;
  rank: number;
  verdict: "best-value" | "competitive" | "costlier" | "quote-expired";
  onTimeRate: number | null;
}

export interface SourceComparison {
  productId: ID;
  name: string;
  sku: string;
  brandName: string;
  categoryName: string;
  sellingPrice: number;
  mrp: number;
  stockOnHand: number;
  onOrder: number;
  reorderLevel: number;
  movement: MovementClass;
  avgUnitCost: number;
  options: SourceOption[];
  costHistory: { month: ISOMonth; [vendorId: string]: number | string }[];
  vendorsInHistory: { id: ID; name: string }[];
  purchaseHistory: { purchaseId: ID; number: string; vendorName: string; date: ISODate; quantity: number; unitCost: number }[];
}

/** One orderable product-from-vendor option, for building purchase orders. */
export interface QuoteOption {
  vendorId: ID;
  vendorName: string;
  productId: ID;
  productName: string;
  sku: string;
  effectiveCost: number;
  minOrderQty: number;
  leadTimeDays: number;
  offerTitle: string | null;
  stockOnHand: number;
  reorderLevel: number;
  isBest: boolean;
}

export interface SourcingRow {
  productId: ID;
  name: string;
  sku: string;
  categoryId: ID;
  categoryName: string;
  brandName: string;
  sellingPrice: number;
  sourceCount: number;
  bestVendorName: string;
  bestCost: number;
  highestCost: number;
  spreadPercent: number;
  lastPaidCost: number | null;
  lastVendorName: string | null;
  changeVsLastPaidPercent: number | null;
  bestMarginPercent: number;
  liveOffers: number;
  stockOnHand: number;
  lowStock: boolean;
  movement: MovementClass;
}

export interface VendorSummary extends Vendor {
  brandNames: string[];
  categoryNames: string[];
  productCount: number;
  purchaseCount: number;
  purchaseValue: number;
  lastPurchaseOn: ISODate | null;
  openOrders: number;
  liveOffers: number;
  onTimeRate: number | null;
  avgDelayDays: number | null;
  fillRate: number | null;
  /** Share of this vendor's quotes that are the cheapest source. */
  bestPriceShare: number;
}

export interface VendorDetail extends VendorSummary {
  products: { productId: ID; name: string; sku: string; quotedCost: number; isBest: boolean; diffVsBestPercent: number; stockOnHand: number; movement: MovementClass }[];
  purchases: PurchaseSummary[];
  offers: VendorOfferView[];
  monthly: { month: ISOMonth; value: number }[];
}

export interface VendorOfferView extends VendorOffer {
  vendorName: string;
  status: OfferStatus;
  daysLeft: number;
  daysToStart: number;
  benefitLabel: string;
  products: { productId: ID; name: string; stockOnHand: number; movement: MovementClass }[];
  usedOnPurchases: number;
  offerType: OfferType;
}

export interface PurchaseSummary {
  id: ID;
  number: string;
  vendorId: ID;
  vendorName: string;
  status: PurchaseStatus;
  orderedOn: ISODate;
  expectedOn: ISODate;
  receivedOn: ISODate | null;
  lineCount: number;
  units: number;
  receivedUnits: number;
  value: number;
  savings: number;
  isLate: boolean;
  daysLate: number;
  categoryNames: string[];
}

export interface PurchaseDetail extends PurchaseSummary {
  notes?: string;
  vendor: Vendor;
  items: {
    productId: ID;
    name: string;
    sku: string;
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
    listUnitCost: number;
    lineValue: number;
    offerTitle: string | null;
    currentStock: number;
  }[];
  receipts: { date: ISODate; productId: ID; productName: string; quantity: number }[];
  freight: number;
}

/* ------------------------------------------------------------------- Sales */

export interface BillSummary {
  id: ID;
  number: string;
  date: ISODate;
  customerId: ID | null;
  customerName: string | null;
  lineCount: number;
  units: number;
  subtotal: number;
  discount: number;
  net: number;
  profit: number;
  paymentMode: PaymentMode;
  kind: BillKind;
  couponCode: string | null;
  categoryNames: string[];
}

export interface BillDetail extends BillSummary {
  items: { productId: ID; name: string; sku: string; categoryName: string; quantity: number; unitPrice: number; unitCost: number; discount: number; lineTotal: number; movementNow: MovementClass }[];
  couponDiscount: number;
  pointsRedeemed: number;
  pointsEarned: number;
  receivable: ReceivableView | null;
  customer: Customer | null;
}

/* --------------------------------------------------------------------- CRM */

export interface CustomerSummary {
  id: ID;
  name: string;
  businessName?: string;
  type: CustomerType;
  phone: string;
  email?: string;
  area: string;
  joinedOn: ISODate;
  bills: number;
  spend: number;
  spend12m: number;
  avgBill: number;
  lastPurchaseOn: ISODate | null;
  daysSinceLastPurchase: number | null;
  tierId: ID;
  tierName: string;
  pointsBalance: number;
  outstanding: number;
  overdue: number;
  creditDays?: number;
}

export interface CustomerDetail extends CustomerSummary {
  customer: Customer;
  recentBills: BillSummary[];
  monthly: { month: ISOMonth; spend: number; bills: number }[];
  topCategories: { categoryId: ID; name: string; spend: number }[];
  topProducts: { productId: ID; name: string; units: number; spend: number }[];
  loyalty: LoyaltyEntry[];
  pointsEarned: number;
  pointsRedeemed: number;
  coupons: { couponId: ID; code: string; title: string; date: ISODate; billId: ID; discount: number }[];
  receivables: ReceivableView[];
  nextTier: { name: string; remaining: number } | null;
}

export interface ReceivableView {
  id: ID;
  customerId: ID;
  customerName: string;
  customerType: CustomerType;
  phone: string;
  billId: ID;
  billNumber: string;
  amount: number;
  paid: number;
  outstanding: number;
  issuedOn: ISODate;
  dueOn: ISODate;
  daysOverdue: number;
  status: ReceivableStatus;
  bucket: AgeingBucket;
  lastPaymentOn: ISODate | null;
  lastPaymentAmount: number | null;
  promisedOn: ISODate | null;
  nextAction: string;
  payments: CollectionPayment[];
  notes: CollectionNote[];
}

export interface CollectionsOverview {
  totalOutstanding: number;
  overdueAmount: number;
  criticalAmount: number;
  dueSoonAmount: number;
  customersOwing: number;
  collectedLast30: number;
  byStatus: { status: ReceivableStatus; amount: number; count: number }[];
  byBucket: { bucket: AgeingBucket; amount: number; count: number }[];
  byCustomer: { customerId: ID; name: string; outstanding: number; overdue: number; oldestDueOn: ISODate; worstStatus: ReceivableStatus; receivables: number }[];
}

export interface LoyaltyMember {
  customerId: ID;
  name: string;
  type: CustomerType;
  tierId: ID;
  tierName: string;
  spend12m: number;
  pointsEarned: number;
  pointsRedeemed: number;
  pointsBalance: number;
  lastActivityOn: ISODate | null;
  nextTierName: string | null;
  toNextTier: number | null;
}

export interface LoyaltyOverview {
  tiers: (LoyaltyTier & { members: number; spend: number })[];
  members: LoyaltyMember[];
  pointsOutstanding: number;
  pointsEarned: number;
  pointsRedeemed: number;
  recent: (LoyaltyEntry & { customerName: string })[];
}

export interface CouponView extends Coupon {
  status: CouponStatus;
  windowFrom: ISODate;
  windowTo: ISODate;
  uses: number;
  discountGiven: number;
  billRevenue: number;
  campaignName: string | null;
  categoryNames: string[];
  discountLabel: string;
  segmentLabel: string;
  nextDate: ISODate | null;
}

export interface CampaignView extends Campaign {
  status: "planned" | "running" | "completed";
  coupons: CouponView[];
  uses: number;
  revenue: number;
  discountGiven: number;
}

/* ----------------------------------------------------------------- Reports */

export interface PeriodTotals {
  range: DateRange;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  bills: number;
  units: number;
  avgBill: number;
  discounts: number;
  purchases: number;
  expenses: number;
  netProfit: number;
  netMarginPercent: number;
  newCustomers: number;
  creditSales: number;
}

export interface TrendPoint {
  bucket: string;
  revenue: number;
  grossProfit: number;
  bills: number;
  units: number;
  previousRevenue?: number;
}

export interface CategoryPerformance {
  categoryId: ID;
  name: string;
  revenue: number;
  grossProfit: number;
  marginPercent: number;
  units: number;
  purchases: number;
  stockValue: number;
  share: number;
  products: number;
  slowCount: number;
  deadCount: number;
  fastCount: number;
  expensesAllocated: number;
  previousRevenue: number;
}

export interface ProductPerformance {
  productId: ID;
  name: string;
  sku: string;
  categoryName: string;
  brandName: string;
  units: number;
  revenue: number;
  grossProfit: number;
  marginPercent: number;
  movement: MovementClass;
}

export interface CustomerPerformance {
  customerId: ID;
  name: string;
  type: CustomerType;
  bills: number;
  revenue: number;
  grossProfit: number;
}

export interface VendorPurchasePerformance {
  vendorId: ID;
  name: string;
  orders: number;
  units: number;
  value: number;
  savings: number;
  share: number;
}

export interface ExpenseBreakdown {
  category: ExpenseCategory;
  label: string;
  amount: number;
  share: number;
  previousAmount: number;
}

export interface ReportFilters {
  categoryId?: ID;
  brandId?: ID;
  vendorId?: ID;
  productId?: ID;
  customerId?: ID;
}

export interface SalesReport {
  totals: PeriodTotals;
  previous: PeriodTotals;
  trend: TrendPoint[];
  byCategory: CategoryPerformance[];
  topProducts: ProductPerformance[];
  bottomProducts: ProductPerformance[];
  topCustomers: CustomerPerformance[];
  byPaymentMode: { mode: PaymentMode; amount: number; bills: number }[];
  byWeekday: { weekday: number; revenue: number; bills: number }[];
  giftBills: { bills: number; revenue: number };
}

export interface PurchaseReport {
  total: number;
  previousTotal: number;
  orders: number;
  units: number;
  savings: number;
  byVendor: VendorPurchasePerformance[];
  byCategory: { categoryId: ID; name: string; value: number; units: number }[];
  byMonth: { bucket: string; value: number }[];
  topProducts: { productId: ID; name: string; units: number; value: number; avgCost: number }[];
}

export interface ProfitReport {
  totals: PeriodTotals;
  previous: PeriodTotals;
  monthly: { month: ISOMonth; revenue: number; cogs: number; grossProfit: number; expenses: number; netProfit: number }[];
  byCategory: CategoryPerformance[];
  lowMarginProducts: ProductPerformance[];
}

export interface ExpenseReport {
  total: number;
  previousTotal: number;
  byCategory: ExpenseBreakdown[];
  monthly: { month: ISOMonth; total: number; [category: string]: number | string }[];
  entries: Expense[];
  revenue: number;
  allocatedToCategories: { categoryId: ID; name: string; amount: number }[];
}

export interface ManagementAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  detail: string;
  href: string;
  metric?: string;
}

export interface DashboardData {
  totals: PeriodTotals;
  previous: PeriodTotals;
  trend: TrendPoint[];
  topCategories: CategoryPerformance[];
  topProducts: ProductPerformance[];
  inventory: InventoryOverview;
  fastMovers: InventoryItem[];
  slowMovers: InventoryItem[];
  lowStock: InventoryItem[];
  recentPurchases: PurchaseSummary[];
  openOrders: PurchaseSummary[];
  vendorPerformance: VendorSummary[];
  liveOffers: VendorOfferView[];
  priceChanges: { productId: ID; name: string; vendorName: string; from: number; to: number; changePercent: number }[];
  collections: CollectionsOverview;
  alerts: ManagementAlert[];
}

/* --------------------------------------------------------------- Catalogue */

export interface CategorySummary extends Category {
  products: number;
  stockValue: number;
  stockUnits: number;
  revenue90: number;
  marginPercent: number;
  movement: Record<MovementClass, number>;
  brands: number;
}

export interface CategoryDetail extends CategorySummary {
  items: InventoryItem[];
  monthly: { month: ISOMonth; revenue: number; grossProfit: number; purchases: number }[];
  brandsBreakdown: { brandId: ID; name: string; revenue: number; products: number }[];
  vendors: { vendorId: ID; name: string; value: number }[];
  expenses: number;
}

export interface BrandSummary extends Brand {
  products: number;
  stockValue: number;
  revenue90: number;
  marginPercent: number;
  vendorNames: string[];
  categoryNames: string[];
  movement: Record<MovementClass, number>;
}

export interface ActivityEvent {
  id: string;
  date: ISODate;
  kind: "purchase" | "receipt" | "sale" | "price" | "adjustment";
  title: string;
  detail: string;
  quantity?: number;
  amount?: number;
  ref?: EntityRef;
}

export interface ProductDetail {
  product: Product;
  item: InventoryItem;
  category: Category;
  brand: Brand;
  priceHistory: PriceRevision[];
  sourcing: SourceComparison;
  salesMonthly: { month: ISOMonth; units: number; revenue: number; grossProfit: number }[];
  topCustomers: { customerId: ID; name: string; units: number; revenue: number }[];
  walkInShare: number;
  unitsSold12m: number;
  revenue12m: number;
  grossProfit12m: number;
  ledger: StockMovementEntry[];
  activity: ActivityEvent[];
  offers: VendorOfferView[];
  decision: DecisionRecommendation;
  pricing: PriceRecommendation;
}

/* ----------------------------------------------------------------- Search */

export interface SearchEntry {
  id: string;
  kind: "product" | "vendor" | "customer" | "purchase" | "bill" | "category" | "brand";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
}
