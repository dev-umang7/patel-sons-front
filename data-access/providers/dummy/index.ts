import type { Repositories } from "../../contracts";
import { derived } from "./context";
import { dummyIntelligenceRepository, dummyPricingRepository, dummySearchRepository } from "./intelligence";
import { dummyInventoryRepository, dummyProductRepository } from "./inventory";
import { dummyPurchaseRepository, dummyVendorRepository } from "./procurement";
import { dummyReportRepository } from "./reports";
import { dummyCollectionsRepository, dummyCrmRepository, dummyCustomerRepository, dummySalesRepository } from "./sales";

export function createDummyRepositories(): Repositories {
  return {
    meta: { getMeta: async () => derived().ds.meta },
    products: dummyProductRepository,
    inventory: dummyInventoryRepository,
    vendors: dummyVendorRepository,
    purchases: dummyPurchaseRepository,
    sales: dummySalesRepository,
    customers: dummyCustomerRepository,
    collections: dummyCollectionsRepository,
    crm: dummyCrmRepository,
    reports: dummyReportRepository,
    pricing: dummyPricingRepository,
    intelligence: dummyIntelligenceRepository,
    search: dummySearchRepository,
  };
}
