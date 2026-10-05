/**
 * DUMMY DATA — entry point. The only consumer is data-access/providers/dummy.
 * The dataset is generated deterministically (fixed seed) and memoised, so every
 * request sees identical, internally consistent records.
 */
import type { Dataset } from "@/data-access/types/dataset";
import { brands, categories, productSeeds } from "./catalog";
import { campaigns, coupons, customerSeeds, loyaltyTiers } from "./customers";
import { simulateCollections } from "./generator/collections";
import { simulateExpenses } from "./generator/expenses";
import { buildCostBook, buildPriceRevisions, buildQuotes } from "./generator/pricing";
import { createRng } from "./generator/random";
import { AS_OF, HISTORY_START } from "./generator/seasonality";
import { simulate } from "./generator/simulate";
import { vendorOffers, vendorSeeds } from "./vendors";

const SEED = 20261004;

function strip<T extends { sim: unknown }>(seed: T): Omit<T, "sim"> {
  const { sim: _sim, ...record } = seed;
  return record;
}

function build(): Dataset {
  const rng = createRng(SEED);
  const revisions = buildPriceRevisions(productSeeds);
  const book = buildCostBook(rng, productSeeds, vendorSeeds);
  const sourceQuotes = buildQuotes(rng, productSeeds, vendorSeeds, book);

  const sim = simulate({
    rng,
    products: productSeeds,
    vendors: vendorSeeds,
    customers: customerSeeds,
    coupons,
    offers: vendorOffers,
    tiers: loyaltyTiers,
    revisions,
    book,
  });
  const collections = simulateCollections(rng, sim.receivables, customerSeeds);
  const expenses = simulateExpenses(rng, sim.purchases, vendorSeeds, sim.cardSalesByMonth);

  const products = productSeeds.map(strip);
  // Management has flagged a few lines; recorded status, not a calculation.
  for (const p of products) {
    if (p.id === "prd-010" || p.id === "prd-040") p.status = "discontinued";
    if (p.id === "prd-007" || p.id === "prd-027") p.status = "under-review";
  }

  return {
    meta: { businessName: "Patel & Sons", asOf: AS_OF, historyStart: HISTORY_START, currency: "INR", source: "dummy" },
    categories,
    brands,
    products,
    priceRevisions: revisions,
    vendors: vendorSeeds.map(strip),
    sourceQuotes,
    costObservations: book.observations,
    vendorOffers,
    purchases: sim.purchases,
    openingStock: sim.openingStock,
    stockAdjustments: sim.stockAdjustments,
    customers: customerSeeds.map(strip),
    bills: sim.bills,
    receivables: sim.receivables,
    collectionPayments: collections.payments,
    collectionNotes: collections.notes,
    loyaltyTiers,
    loyaltyEntries: sim.loyaltyEntries,
    coupons,
    campaigns,
    expenses,
  };
}

const cache = globalThis as typeof globalThis & { __patelSonsDataset?: Dataset };

export function getDummyDataset(): Dataset {
  cache.__patelSonsDataset ??= build();
  return cache.__patelSonsDataset;
}
