/**
 * Repository contracts. The UI depends only on these interfaces and the view
 * models in ./types. Providers (dummy today, API later) implement them.
 */
import type { Granularity } from "@/lib/period";
import type { DatasetMeta, DateRange, ID } from "./types/common";
import type {
  BillDetail,
  BillSummary,
  BrandSummary,
  CampaignView,
  CategoryDetail,
  CategoryPerformance,
  CategorySummary,
  CollectionsOverview,
  CouponView,
  CustomerDetail,
  CustomerSummary,
  DashboardData,
  DecisionItem,
  ExpenseReport,
  GiftRecommendation,
  GiftRequest,
  InventoryItem,
  InventoryOverview,
  LoyaltyOverview,
  PriceRecommendation,
  PricingOpportunity,
  ProductDetail,
  ProfitReport,
  PurchaseDetail,
  PurchaseReport,
  PurchaseSummary,
  QuoteOption,
  ReceivableView,
  ReportFilters,
  SalesReport,
  SearchEntry,
  SourceComparison,
  SourcingRow,
  StockMovementRow,
  VendorDetail,
  VendorOfferView,
  VendorSummary,
} from "./types/views";
import type { StockMovementType } from "./types/inventory";

export interface ReportPeriod {
  range: DateRange;
  previous: DateRange;
  granularity: Granularity;
}

export interface Option {
  id: ID;
  name: string;
}

export interface MetaRepository {
  getMeta(): Promise<DatasetMeta>;
}

export interface ProductRepository {
  getProduct(id: ID): Promise<ProductDetail | null>;
  listCategories(): Promise<CategorySummary[]>;
  getCategory(id: ID): Promise<CategoryDetail | null>;
  listBrands(): Promise<BrandSummary[]>;
  listCategoryOptions(): Promise<Option[]>;
  listBrandOptions(): Promise<Option[]>;
}

export interface InventoryRepository {
  listInventory(): Promise<InventoryItem[]>;
  getOverview(): Promise<InventoryOverview>;
  listStockMovements(range: DateRange, type?: StockMovementType): Promise<StockMovementRow[]>;
  listDecisions(): Promise<DecisionItem[]>;
}

export interface VendorRepository {
  listVendors(): Promise<VendorSummary[]>;
  getVendor(id: ID): Promise<VendorDetail | null>;
  listOffers(): Promise<VendorOfferView[]>;
  listVendorOptions(): Promise<Option[]>;
}

export interface PurchaseRepository {
  listPurchases(): Promise<PurchaseSummary[]>;
  getPurchase(id: ID): Promise<PurchaseDetail | null>;
  listSourcing(): Promise<SourcingRow[]>;
  getSourceComparison(productId: ID): Promise<SourceComparison | null>;
  listQuoteOptions(): Promise<QuoteOption[]>;
}

export interface SalesRepository {
  listBills(range: DateRange): Promise<BillSummary[]>;
  getBill(id: ID): Promise<BillDetail | null>;
}

export interface CustomerRepository {
  listCustomers(): Promise<CustomerSummary[]>;
  getCustomer(id: ID): Promise<CustomerDetail | null>;
  listCustomerOptions(): Promise<Option[]>;
}

export interface CollectionsRepository {
  listReceivables(options?: { includePaid?: boolean }): Promise<ReceivableView[]>;
  getOverview(): Promise<CollectionsOverview>;
}

export interface CrmRepository {
  getLoyalty(): Promise<LoyaltyOverview>;
  listCoupons(): Promise<CouponView[]>;
  listCampaigns(): Promise<CampaignView[]>;
}

export interface ReportRepository {
  getDashboard(period: ReportPeriod): Promise<DashboardData>;
  getSalesReport(period: ReportPeriod, filters?: ReportFilters): Promise<SalesReport>;
  getPurchaseReport(period: ReportPeriod, filters?: ReportFilters): Promise<PurchaseReport>;
  getProfitReport(period: ReportPeriod): Promise<ProfitReport>;
  getCategoryReport(period: ReportPeriod): Promise<CategoryPerformance[]>;
  getExpenseReport(period: ReportPeriod): Promise<ExpenseReport>;
}

export interface PricingRepository {
  listCandidates(): Promise<InventoryItem[]>;
  listOpportunities(minChangePercent?: number): Promise<PricingOpportunity[]>;
  getRecommendation(productId: ID, targetMarginPercent?: number): Promise<{ item: InventoryItem; comparison: SourceComparison; recommendation: PriceRecommendation } | null>;
}

export interface IntelligenceRepository {
  recommendGifts(request: GiftRequest): Promise<GiftRecommendation>;
}

export interface SearchRepository {
  search(query: string, limit?: number): Promise<SearchEntry[]>;
}

export interface Repositories {
  meta: MetaRepository;
  products: ProductRepository;
  inventory: InventoryRepository;
  vendors: VendorRepository;
  purchases: PurchaseRepository;
  sales: SalesRepository;
  customers: CustomerRepository;
  collections: CollectionsRepository;
  crm: CrmRepository;
  reports: ReportRepository;
  pricing: PricingRepository;
  intelligence: IntelligenceRepository;
  search: SearchRepository;
}
