import type { IntelligenceRepository, PricingRepository, SearchRepository } from "../../contracts";
import { recommendGifts } from "../../simulated/gift-engine";
import { composePrice } from "../../simulated/pricing-engine";
import type { ID } from "../../types/common";
import type { InventoryItem, PricingOpportunity, SearchEntry } from "../../types/views";
import { derived, latency } from "./context";
import { categoryMargin } from "./inventory";
import { sourceComparison } from "./procurement";

function recommendationFor(item: InventoryItem, targetMarginPercent?: number) {
  const d = derived();
  const comparison = sourceComparison(item.productId)!;
  const revisions = d.ds.priceRevisions.filter((r) => r.productId === item.productId).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  const recommendation = composePrice({
    item,
    sources: comparison.options,
    purchaseCosts: comparison.purchaseHistory.slice(0, 6).map((p) => p.unitCost),
    categoryName: item.categoryName,
    categoryMarginPercent: categoryMargin(item.categoryId),
    previousPrice: revisions.length > 1 ? revisions[revisions.length - 2].sellingPrice : null,
    targetMarginPercent,
  });
  return { comparison, recommendation };
}

let opportunityCache: PricingOpportunity[] | null = null;

export const dummyPricingRepository: PricingRepository = {
  async listCandidates() {
    await latency();
    return derived().inventory.filter((i) => i.status !== "discontinued");
  },
  async getRecommendation(productId, targetMarginPercent) {
    await latency();
    const item = derived().inventoryById.get(productId);
    if (!item) return null;
    return { item, ...recommendationFor(item, targetMarginPercent) };
  },
  async listOpportunities(minChangePercent = 3) {
    await latency();
    opportunityCache ??= derived()
      .inventory.filter((i) => i.status !== "discontinued")
      .map((item): PricingOpportunity => {
        const { sell } = recommendationFor(item).recommendation;
        return { productId: item.productId, name: item.name, categoryName: item.categoryName, movement: item.movement, current: sell.current, recommended: sell.recommended, changePercent: sell.changePercent, currentMarginPercent: sell.currentMarginPercent, expectedMarginPercent: sell.expectedMarginPercent, confidence: sell.confidence };
      });
    return opportunityCache.filter((o) => Math.abs(o.changePercent) >= minChangePercent).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  },
};

export const dummyIntelligenceRepository: IntelligenceRepository = {
  async recommendGifts(request) {
    await latency();
    const d = derived();
    const bought = new Set<ID>();
    if (request.customerId) for (const l of d.saleLines) if (l.customerId === request.customerId) bought.add(l.productId);
    return recommendGifts(request, d.inventory, bought);
  },
};

let index: SearchEntry[] | null = null;
function searchIndex(): SearchEntry[] {
  if (index) return index;
  const d = derived();
  index = [
    ...d.inventory.map((i) => ({ id: i.productId, kind: "product" as const, title: i.name, subtitle: `${i.sku} · ${i.categoryName} · ${i.stockOnHand} in stock`, href: `/inventory/products/${i.productId}`, keywords: `${i.name} ${i.sku} ${i.brandName} ${i.categoryName}`.toLowerCase() })),
    ...d.ds.vendors.map((v) => ({ id: v.id, kind: "vendor" as const, title: v.name, subtitle: `${v.city} · ${v.contactPerson}`, href: `/procurement/vendors/${v.id}`, keywords: `${v.name} ${v.city} ${v.contactPerson}`.toLowerCase() })),
    ...d.ds.customers.map((c) => ({ id: c.id, kind: "customer" as const, title: c.businessName ?? c.name, subtitle: c.businessName ? `${c.name} · ${c.area}` : `${c.area} · ${c.phone}`, href: `/crm/customers/${c.id}`, keywords: `${c.name} ${c.businessName ?? ""} ${c.phone} ${c.area}`.toLowerCase() })),
    ...d.ds.categories.map((c) => ({ id: c.id, kind: "category" as const, title: c.name, subtitle: "Category", href: `/inventory/categories/${c.id}`, keywords: c.name.toLowerCase() })),
    ...d.ds.brands.map((b) => ({ id: b.id, kind: "brand" as const, title: b.name, subtitle: "Brand", href: `/inventory/brands?brand=${b.id}`, keywords: b.name.toLowerCase() })),
    ...d.ds.purchases.map((p) => ({ id: p.id, kind: "purchase" as const, title: p.number, subtitle: `${d.vendorName(p.vendorId)} · ${p.orderedOn}`, href: `/procurement/purchases/${p.id}`, keywords: `${p.number} ${d.vendorName(p.vendorId)}`.toLowerCase() })),
    ...d.billsAsc.map((b) => ({ id: b.id, kind: "bill" as const, title: b.number, subtitle: `${d.customerName(b.customerId) ?? "Walk-in"} · ${b.date}`, href: `/sales/bills/${b.id}`, keywords: `${b.number} ${d.customerName(b.customerId) ?? ""}`.toLowerCase() })),
  ];
  return index;
}

const KIND_PRIORITY: Record<SearchEntry["kind"], number> = { product: 0, customer: 1, vendor: 2, category: 3, brand: 4, purchase: 5, bill: 6 };

export const dummySearchRepository: SearchRepository = {
  async search(query, limit = 24) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    return searchIndex()
      .filter((e) => terms.every((t) => e.keywords.includes(t)))
      .sort((a, b) => Number(!a.keywords.startsWith(q)) - Number(!b.keywords.startsWith(q)) || KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind])
      .slice(0, limit);
  },
};
