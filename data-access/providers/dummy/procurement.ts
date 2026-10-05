import { diffDays, eachMonth } from "@/lib/dates";
import { marginPercent } from "../../calculations/movement";
import { describeOfferBenefit, effectiveUnitCost, isOfferLive, offerStatus } from "../../calculations/offers";
import { purchaseSavings, purchaseValue, receivedValue, vendorPerformance, type VendorPerformance } from "../../calculations/vendors";
import type { PurchaseRepository, VendorRepository } from "../../contracts";
import { PRICE_COMPARISON_RULES } from "../../rules/assumptions";
import type { ID } from "../../types/common";
import type { Purchase, VendorOffer } from "../../types/procurement";
import type {
  PurchaseDetail,
  PurchaseSummary,
  QuoteOption,
  SourceComparison,
  SourceOption,
  SourcingRow,
  VendorDetail,
  VendorOfferView,
  VendorSummary,
} from "../../types/views";
import { derived, latency } from "./context";

let perfCache: Map<ID, VendorPerformance> | null = null;
function performanceByVendor(): Map<ID, VendorPerformance> {
  if (perfCache) return perfCache;
  const d = derived();
  perfCache = new Map(d.ds.vendors.map((v) => [v.id, vendorPerformance(d.ds.purchases.filter((p) => p.vendorId === v.id))]));
  return perfCache;
}

export function toOfferView(offer: VendorOffer): VendorOfferView {
  const d = derived();
  return {
    ...offer,
    vendorName: d.vendorName(offer.vendorId),
    status: offerStatus(offer, d.asOf),
    daysLeft: Math.max(0, diffDays(d.asOf, offer.endsOn)),
    daysToStart: Math.max(0, diffDays(d.asOf, offer.startsOn)),
    benefitLabel: describeOfferBenefit(offer.benefit),
    products: offer.productIds.map((id) => {
      const item = d.inventoryById.get(id)!;
      return { productId: id, name: item.name, stockOnHand: item.stockOnHand, movement: item.movement };
    }),
    usedOnPurchases: d.ds.purchases.filter((p) => p.items.some((i) => i.offerId === offer.id)).length,
    offerType: offer.type,
  };
}

export function toPurchaseSummary(p: Purchase): PurchaseSummary {
  const d = derived();
  const open = p.status === "ordered" || p.status === "partially-received";
  const daysLate = open ? Math.max(0, diffDays(p.expectedOn, d.asOf)) : p.receivedOn ? Math.max(0, diffDays(p.expectedOn, p.receivedOn)) : 0;
  return {
    id: p.id,
    number: p.number,
    vendorId: p.vendorId,
    vendorName: d.vendorName(p.vendorId),
    status: p.status,
    orderedOn: p.orderedOn,
    expectedOn: p.expectedOn,
    receivedOn: p.receivedOn ?? null,
    lineCount: p.items.length,
    units: p.items.reduce((a, i) => a + i.quantity, 0),
    receivedUnits: p.items.reduce((a, i) => a + i.receivedQuantity, 0),
    value: Math.round(purchaseValue(p)),
    savings: Math.round(purchaseSavings(p)),
    isLate: open && daysLate > 0,
    daysLate,
    categoryNames: [...new Set(p.items.map((i) => d.categoryName(d.productById.get(i.productId)!.categoryId)))],
  };
}

function lastPaid(productId: ID, vendorId?: ID): { cost: number; date: string } | null {
  const d = derived();
  let best: { cost: number; date: string } | null = null;
  for (const p of d.ds.purchases) {
    if (vendorId && p.vendorId !== vendorId) continue;
    const item = p.items.find((i) => i.productId === productId);
    if (!item) continue;
    for (const r of p.receipts) {
      if (r.productId === productId && (!best || r.date > best.date)) best = { cost: item.unitCost, date: r.date };
    }
  }
  return best;
}

export function sourceOptions(productId: ID): SourceOption[] {
  const d = derived();
  const item = d.inventoryById.get(productId)!;
  const perf = performanceByVendor();
  const quotes = d.ds.sourceQuotes.filter((q) => q.productId === productId);

  const options = quotes.map((q) => {
    const vendor = d.ds.vendors.find((v) => v.id === q.vendorId)!;
    const offer = d.ds.vendorOffers.find((o) => o.vendorId === q.vendorId && o.productIds.includes(productId) && offerStatus(o, d.asOf) !== "expired");
    const live = offer ? isOfferLive(offer, d.asOf) : false;
    const effectiveCost = Math.round(live && offer ? effectiveUnitCost(q.unitCost, offer.benefit) : q.unitCost);
    const paid = lastPaid(productId, q.vendorId);
    return {
      quoteId: q.id,
      vendorId: q.vendorId,
      vendorName: vendor.name,
      vendorType: vendor.type,
      city: vendor.city,
      quotedCost: q.unitCost,
      effectiveCost,
      minOrderQty: Math.max(q.minOrderQty, live && offer?.minQty ? offer.minQty : 0),
      leadTimeDays: q.leadTimeDays,
      quotedOn: q.quotedOn,
      validUntil: q.validUntil,
      quoteExpired: q.validUntil < d.asOf,
      offer: offer
        ? { id: offer.id, title: offer.title, benefit: offer.benefit, benefitLabel: describeOfferBenefit(offer.benefit), status: offerStatus(offer, d.asOf), minQty: offer.minQty, endsOn: offer.endsOn }
        : null,
      lastPaidCost: paid?.cost ?? null,
      lastPaidOn: paid?.date ?? null,
      expectedMarginPercent: marginPercent(item.sellingPrice, effectiveCost),
      diffVsBestPercent: 0,
      rank: 0,
      verdict: "costlier" as SourceOption["verdict"],
      onTimeRate: perf.get(q.vendorId)?.onTimeRate ?? null,
    };
  });

  const valid = options.filter((o) => !o.quoteExpired);
  const bestCost = valid.length > 0 ? Math.min(...valid.map((o) => o.effectiveCost)) : Math.min(...options.map((o) => o.effectiveCost));
  const ranked = [...options].sort((a, b) => Number(a.quoteExpired) - Number(b.quoteExpired) || a.effectiveCost - b.effectiveCost);
  ranked.forEach((o, i) => {
    o.rank = i + 1;
    o.diffVsBestPercent = ((o.effectiveCost - bestCost) / bestCost) * 100;
    o.verdict = o.quoteExpired
      ? "quote-expired"
      : o.effectiveCost === bestCost
        ? "best-value"
        : o.diffVsBestPercent <= PRICE_COMPARISON_RULES.competitiveWithinPercent
          ? "competitive"
          : "costlier";
  });
  return ranked;
}

export function sourceComparison(productId: ID): SourceComparison | null {
  const d = derived();
  const item = d.inventoryById.get(productId);
  if (!item) return null;
  const vendorIds = [...new Set(d.ds.costObservations.filter((c) => c.productId === productId).map((c) => c.vendorId))];
  const months = eachMonth(d.ds.meta.historyStart, d.asOf);
  const costHistory = months.map((month) => {
    const row: SourceComparison["costHistory"][number] = { month };
    for (const c of d.ds.costObservations) if (c.productId === productId && c.month === month) row[c.vendorId] = c.unitCost;
    return row;
  });

  const purchaseHistory = d.ds.purchases
    .filter((p) => p.receipts.some((r) => r.productId === productId))
    .map((p) => {
      const line = p.items.find((i) => i.productId === productId)!;
      return { purchaseId: p.id, number: p.number, vendorName: d.vendorName(p.vendorId), date: p.receipts.find((r) => r.productId === productId)!.date, quantity: line.receivedQuantity, unitCost: line.unitCost };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    productId,
    name: item.name,
    sku: item.sku,
    brandName: item.brandName,
    categoryName: item.categoryName,
    sellingPrice: item.sellingPrice,
    mrp: item.mrp,
    stockOnHand: item.stockOnHand,
    onOrder: item.onOrder,
    reorderLevel: item.reorderLevel,
    movement: item.movement,
    avgUnitCost: item.avgUnitCost,
    options: sourceOptions(productId),
    costHistory,
    vendorsInHistory: vendorIds.map((id) => ({ id, name: d.vendorName(id) })),
    purchaseHistory,
  };
}

function vendorSummary(vendorId: ID): VendorSummary {
  const d = derived();
  const vendor = d.ds.vendors.find((v) => v.id === vendorId)!;
  const perf = performanceByVendor().get(vendorId)!;
  const purchases = d.ds.purchases.filter((p) => p.vendorId === vendorId);
  const productIds = [...new Set(d.ds.sourceQuotes.filter((q) => q.vendorId === vendorId).map((q) => q.productId))];
  const quotes = d.ds.sourceQuotes.filter((q) => q.vendorId === vendorId);
  const bestCount = quotes.filter((q) => sourceOptions(q.productId).find((o) => o.vendorId === vendorId)?.verdict === "best-value").length;
  const received = purchases.filter((p) => p.receipts.length > 0);
  return {
    ...vendor,
    brandNames: vendor.brandIds.map(d.brandName),
    categoryNames: [...new Set(productIds.map((id) => d.categoryName(d.productById.get(id)!.categoryId)))],
    productCount: productIds.length,
    purchaseCount: received.length,
    purchaseValue: Math.round(received.reduce((a, p) => a + receivedValue(p), 0)),
    lastPurchaseOn: received.map((p) => p.orderedOn).sort().at(-1) ?? null,
    openOrders: purchases.filter((p) => p.status === "ordered" || p.status === "partially-received" || p.status === "draft").length,
    liveOffers: d.ds.vendorOffers.filter((o) => o.vendorId === vendorId && ["active", "expiring"].includes(offerStatus(o, d.asOf))).length,
    onTimeRate: perf.onTimeRate,
    avgDelayDays: perf.avgDelayDays,
    fillRate: perf.fillRate,
    bestPriceShare: quotes.length > 0 ? (bestCount / quotes.length) * 100 : 0,
  };
}

let vendorSummaries: VendorSummary[] | null = null;
export function allVendorSummaries(): VendorSummary[] {
  vendorSummaries ??= derived().ds.vendors.map((v) => vendorSummary(v.id));
  return vendorSummaries;
}

export const dummyVendorRepository: VendorRepository = {
  async listVendors() {
    await latency();
    return allVendorSummaries();
  },
  async getVendor(id) {
    await latency();
    const d = derived();
    const summary = allVendorSummaries().find((v) => v.id === id);
    if (!summary) return null;
    const products = d.ds.sourceQuotes
      .filter((q) => q.vendorId === id)
      .map((q) => {
        const option = sourceOptions(q.productId).find((o) => o.vendorId === id)!;
        const item = d.inventoryById.get(q.productId)!;
        return { productId: q.productId, name: item.name, sku: item.sku, quotedCost: option.effectiveCost, isBest: option.verdict === "best-value", diffVsBestPercent: option.diffVsBestPercent, stockOnHand: item.stockOnHand, movement: item.movement };
      });
    const purchases = d.ds.purchases.filter((p) => p.vendorId === id);
    const monthly = eachMonth(d.ds.meta.historyStart, d.asOf).map((month) => ({
      month,
      value: Math.round(purchases.filter((p) => p.orderedOn.startsWith(month) && p.status !== "draft" && p.status !== "cancelled").reduce((a, p) => a + purchaseValue(p), 0)),
    }));
    const detail: VendorDetail = {
      ...summary,
      products,
      purchases: purchases.map(toPurchaseSummary).sort((a, b) => b.orderedOn.localeCompare(a.orderedOn)),
      offers: d.ds.vendorOffers.filter((o) => o.vendorId === id).map(toOfferView),
      monthly,
    };
    return detail;
  },
  async listOffers() {
    await latency();
    return derived().ds.vendorOffers.map(toOfferView);
  },
  async listVendorOptions() {
    return derived().ds.vendors.map((v) => ({ id: v.id, name: v.name })).sort((a, b) => a.name.localeCompare(b.name));
  },
};

export const dummyPurchaseRepository: PurchaseRepository = {
  async listPurchases() {
    await latency();
    return derived().ds.purchases.map(toPurchaseSummary).sort((a, b) => b.orderedOn.localeCompare(a.orderedOn) || b.number.localeCompare(a.number));
  },
  async getPurchase(id) {
    await latency();
    const d = derived();
    const p = d.ds.purchases.find((x) => x.id === id);
    if (!p) return null;
    const detail: PurchaseDetail = {
      ...toPurchaseSummary(p),
      notes: p.notes,
      vendor: d.ds.vendors.find((v) => v.id === p.vendorId)!,
      items: p.items.map((i) => {
        const product = d.inventoryById.get(i.productId)!;
        return {
          productId: i.productId,
          name: product.name,
          sku: product.sku,
          quantity: i.quantity,
          receivedQuantity: i.receivedQuantity,
          unitCost: i.unitCost,
          listUnitCost: i.listUnitCost,
          lineValue: i.quantity * i.unitCost,
          offerTitle: i.offerId ? (d.ds.vendorOffers.find((o) => o.id === i.offerId)?.title ?? null) : null,
          currentStock: product.stockOnHand,
        };
      }),
      receipts: p.receipts.map((r) => ({ ...r, productName: d.inventoryById.get(r.productId)!.name })),
      freight: d.ds.expenses.filter((e) => e.purchaseId === p.id).reduce((a, e) => a + e.amount, 0),
    };
    return detail;
  },
  async listSourcing() {
    await latency();
    const d = derived();
    return d.inventory
      .filter((i) => i.status !== "discontinued")
      .map((item): SourcingRow => {
        const options = sourceOptions(item.productId);
        const valid = options.filter((o) => !o.quoteExpired);
        const pool = valid.length > 0 ? valid : options;
        const best = pool[0];
        const highest = Math.max(...pool.map((o) => o.effectiveCost));
        const paid = lastPaid(item.productId);
        return {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          brandName: item.brandName,
          sellingPrice: item.sellingPrice,
          sourceCount: options.length,
          bestVendorName: best.vendorName,
          bestCost: best.effectiveCost,
          highestCost: highest,
          spreadPercent: ((highest - best.effectiveCost) / best.effectiveCost) * 100,
          lastPaidCost: paid?.cost ?? null,
          lastVendorName: item.lastVendorName,
          changeVsLastPaidPercent: paid ? ((best.effectiveCost - paid.cost) / paid.cost) * 100 : null,
          bestMarginPercent: best.expectedMarginPercent,
          liveOffers: options.filter((o) => o.offer && (o.offer.status === "active" || o.offer.status === "expiring")).length,
          stockOnHand: item.stockOnHand,
          lowStock: item.lowStock,
          movement: item.movement,
        };
      });
  },
  async getSourceComparison(productId) {
    await latency();
    return sourceComparison(productId);
  },
  async listQuoteOptions() {
    await latency();
    const d = derived();
    return d.inventory
      .filter((i) => i.status !== "discontinued")
      .flatMap((item) =>
        sourceOptions(item.productId)
          .filter((o) => !o.quoteExpired)
          .map(
            (o): QuoteOption => ({
              vendorId: o.vendorId,
              vendorName: o.vendorName,
              productId: item.productId,
              productName: item.name,
              sku: item.sku,
              effectiveCost: o.effectiveCost,
              minOrderQty: o.minOrderQty,
              leadTimeDays: o.leadTimeDays,
              offerTitle: o.offer && (o.offer.status === "active" || o.offer.status === "expiring") ? o.offer.title : null,
              stockOnHand: item.stockOnHand,
              reorderLevel: item.reorderLevel,
              isBest: o.verdict === "best-value",
            }),
          ),
      );
  },
};
