/**
 * Data-access entry point — the ONLY module UI code imports repositories from.
 *
 * To move to a real backend: implement `Repositories` in providers/api, switch
 * the provider below, and delete /dummy-data. UI code does not change.
 */
import "server-only";
import type { Repositories } from "./contracts";
import { createDummyRepositories } from "./providers/dummy";

const repositories: Repositories = createDummyRepositories();

export const metaRepository = repositories.meta;
export const productRepository = repositories.products;
export const inventoryRepository = repositories.inventory;
export const vendorRepository = repositories.vendors;
export const purchaseRepository = repositories.purchases;
export const salesRepository = repositories.sales;
export const customerRepository = repositories.customers;
export const collectionsRepository = repositories.collections;
export const crmRepository = repositories.crm;
export const reportRepository = repositories.reports;
export const pricingRepository = repositories.pricing;
export const intelligenceRepository = repositories.intelligence;
export const searchRepository = repositories.search;

export type { Option, ReportPeriod, Repositories } from "./contracts";
