import { addDays, eachMonth, isWithin } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import type { InventoryRepository, ProductRepository } from "../../contracts";
import { recommendDecision } from "../../simulated/decision-engine";
import { composePrice } from "../../simulated/pricing-engine";
import type { ID } from "../../types/common";
import type { MovementClass } from "../../types/inventory";
import type {
  ActivityEvent,
  BrandSummary,
  CategoryDetail,
  CategorySummary,
  DecisionItem,
  InventoryItem,
  InventoryOverview,
  ProductDetail,
  StockMovementRow,
} from "../../types/views";
import { derived, latency } from "./context";
import { sourceComparison, toOfferView } from "./procurement";

const MOVEMENTS: MovementClass[] = ["fast", "normal", "slow", "dead"];

function movementCounts(items: InventoryItem[]): Record<MovementClass, number> {
  const out: Record<MovementClass, number> = { fast: 0, normal: 0, slow: 0, dead: 0 };
  for (const i of items) out[i.movement]++;
  return out;
}

function weightedMargin(items: InventoryItem[]): number {
  const revenue = items.reduce((a, i) => a + i.revenue90, 0);
  if (revenue === 0) return items.length ? items.reduce((a, i) => a + i.marginPercent, 0) / items.length : 0;
  return items.reduce((a, i) => a + i.marginPercent * i.revenue90, 0) / revenue;
}

export function categoryMargin(categoryId: ID): number {
  return weightedMargin(derived().inventory.filter((i) => i.categoryId === categoryId));
}

function categorySummary(categoryId: ID): CategorySummary {
  const d = derived();
  const category = d.ds.categories.find((c) => c.id === categoryId)!;
  const items = d.inventory.filter((i) => i.categoryId === categoryId);
  return {
    ...category,
    products: items.length,
    stockValue: items.reduce((a, i) => a + i.stockValue, 0),
    stockUnits: items.reduce((a, i) => a + i.stockOnHand, 0),
    revenue90: items.reduce((a, i) => a + i.revenue90, 0),
    marginPercent: weightedMargin(items),
    movement: movementCounts(items),
    brands: new Set(items.map((i) => i.brandId)).size,
  };
}

let decisionCache: DecisionItem[] | null = null;
export function allDecisions(): DecisionItem[] {
  const d = derived();
  decisionCache ??= d.inventory.map((item) => ({ ...item, recommendation: recommendDecision(item, d.inventory) }));
  return decisionCache;
}

export const dummyProductRepository: ProductRepository = {
  async getProduct(id) {
    await latency();
    const d = derived();
    const product = d.productById.get(id);
    const item = d.inventoryById.get(id);
    if (!product || !item) return null;

    const lines = d.saleLines.filter((l) => l.productId === id);
    const yearFrom = addDays(d.asOf, -364);
    const year = lines.filter((l) => l.date >= yearFrom);
    const salesMonthly = eachMonth(d.ds.meta.historyStart, d.asOf).map((month) => {
      const m = lines.filter((l) => l.date.startsWith(month));
      const revenue = m.reduce((a, l) => a + l.revenue, 0);
      return { month, units: m.reduce((a, l) => a + l.quantity, 0), revenue: Math.round(revenue), grossProfit: Math.round(revenue - m.reduce((a, l) => a + l.cost, 0)) };
    });

    const byCustomer = new Map<ID, { units: number; revenue: number }>();
    let walkInUnits = 0;
    for (const l of year) {
      if (!l.customerId) {
        walkInUnits += l.quantity;
        continue;
      }
      const acc = byCustomer.get(l.customerId) ?? { units: 0, revenue: 0 };
      acc.units += l.quantity;
      acc.revenue += l.revenue;
      byCustomer.set(l.customerId, acc);
    }
    const unitsSold12m = year.reduce((a, l) => a + l.quantity, 0);
    const revenue12m = year.reduce((a, l) => a + l.revenue, 0);

    const priceHistory = d.ds.priceRevisions.filter((r) => r.productId === id).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    const sourcing = sourceComparison(id)!;
    const ledger = d.stockStates.get(id)!.ledger;

    const activity: ActivityEvent[] = [];
    for (const p of d.ds.purchases) {
      const line = p.items.find((i) => i.productId === id);
      if (!line) continue;
      if (p.status !== "draft") {
        activity.push({ id: `po-${p.id}`, date: p.orderedOn, kind: "purchase", title: `Ordered ${line.quantity} from ${d.vendorName(p.vendorId)}`, detail: `${p.number} · ${formatCurrency(line.unitCost)} per unit`, quantity: line.quantity, amount: line.quantity * line.unitCost, ref: { kind: "purchase", id: p.id, label: p.number } });
      }
      for (const r of p.receipts.filter((x) => x.productId === id)) {
        activity.push({ id: `rc-${p.id}-${r.date}`, date: r.date, kind: "receipt", title: `Received ${r.quantity} units`, detail: `Against ${p.number}`, quantity: r.quantity, ref: { kind: "purchase", id: p.id, label: p.number } });
      }
    }
    for (const r of priceHistory) {
      activity.push({ id: `pr-${r.id}`, date: r.effectiveFrom, kind: "price", title: `Selling price set to ${formatCurrency(r.sellingPrice)}`, detail: r.note });
    }
    for (const a of d.ds.stockAdjustments.filter((x) => x.productId === id)) {
      activity.push({ id: `ad-${a.id}`, date: a.date, kind: "adjustment", title: `Stock ${a.quantity > 0 ? "+" : ""}${a.quantity}`, detail: a.note, quantity: a.quantity });
    }
    const salesByDay = new Map<string, { units: number; revenue: number; bills: number }>();
    for (const l of lines) {
      const acc = salesByDay.get(l.date) ?? { units: 0, revenue: 0, bills: 0 };
      acc.units += l.quantity;
      acc.revenue += l.revenue;
      acc.bills += 1;
      salesByDay.set(l.date, acc);
    }
    for (const [date, s] of salesByDay) {
      activity.push({ id: `sl-${date}`, date, kind: "sale", title: `Sold ${s.units} unit${s.units > 1 ? "s" : ""}`, detail: `${s.bills} bill${s.bills > 1 ? "s" : ""} · ${formatCurrency(Math.round(s.revenue))}`, quantity: -s.units, amount: s.revenue });
    }
    activity.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind));

    const purchaseCosts = sourcing.purchaseHistory.slice(0, 6).map((p) => p.unitCost);
    const previous = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].sellingPrice : null;

    const detail: ProductDetail = {
      product,
      item,
      category: d.ds.categories.find((c) => c.id === product.categoryId)!,
      brand: d.ds.brands.find((b) => b.id === product.brandId)!,
      priceHistory,
      sourcing,
      salesMonthly,
      topCustomers: [...byCustomer]
        .map(([customerId, v]) => ({ customerId, name: d.customerName(customerId)!, units: v.units, revenue: Math.round(v.revenue) }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 6),
      walkInShare: unitsSold12m > 0 ? (walkInUnits / unitsSold12m) * 100 : 0,
      unitsSold12m,
      revenue12m: Math.round(revenue12m),
      grossProfit12m: Math.round(revenue12m - year.reduce((a, l) => a + l.cost, 0)),
      ledger: [...ledger].reverse().slice(0, 120),
      activity: activity.slice(0, 80),
      offers: d.ds.vendorOffers.filter((o) => o.productIds.includes(id)).map(toOfferView),
      decision: allDecisions().find((x) => x.productId === id)!.recommendation,
      pricing: composePrice({ item, sources: sourcing.options, purchaseCosts, categoryName: item.categoryName, categoryMarginPercent: categoryMargin(item.categoryId), previousPrice: previous }),
    };
    return detail;
  },

  async listCategories() {
    await latency();
    return derived().ds.categories.map((c) => categorySummary(c.id));
  },

  async getCategory(id) {
    await latency();
    const d = derived();
    if (!d.ds.categories.some((c) => c.id === id)) return null;
    const summary = categorySummary(id);
    const items = d.inventory.filter((i) => i.categoryId === id);
    const lines = d.saleLines.filter((l) => l.categoryId === id);
    const productIds = new Set(items.map((i) => i.productId));
    const monthly = eachMonth(d.ds.meta.historyStart, d.asOf).map((month) => {
      const m = lines.filter((l) => l.date.startsWith(month));
      const revenue = m.reduce((a, l) => a + l.revenue, 0);
      const purchases = d.ds.purchases.reduce(
        (acc, p) => acc + p.receipts.filter((r) => r.date.startsWith(month) && productIds.has(r.productId)).reduce((a, r) => a + r.quantity * p.items.find((i) => i.productId === r.productId)!.unitCost, 0),
        0,
      );
      return { month, revenue: Math.round(revenue), grossProfit: Math.round(revenue - m.reduce((a, l) => a + l.cost, 0)), purchases: Math.round(purchases) };
    });
    const brandMap = new Map<ID, { revenue: number; products: Set<ID> }>();
    for (const i of items) {
      const acc = brandMap.get(i.brandId) ?? { revenue: 0, products: new Set<ID>() };
      acc.products.add(i.productId);
      brandMap.set(i.brandId, acc);
    }
    for (const l of lines) brandMap.get(l.brandId)!.revenue += l.revenue;
    const vendorMap = new Map<ID, number>();
    for (const p of d.ds.purchases) {
      for (const r of p.receipts) {
        if (!productIds.has(r.productId)) continue;
        const cost = p.items.find((i) => i.productId === r.productId)!.unitCost;
        vendorMap.set(p.vendorId, (vendorMap.get(p.vendorId) ?? 0) + r.quantity * cost);
      }
    }
    const detail: CategoryDetail = {
      ...summary,
      items,
      monthly,
      brandsBreakdown: [...brandMap].map(([brandId, v]) => ({ brandId, name: d.brandName(brandId), revenue: Math.round(v.revenue), products: v.products.size })).sort((a, b) => b.revenue - a.revenue),
      vendors: [...vendorMap].map(([vendorId, value]) => ({ vendorId, name: d.vendorName(vendorId), value: Math.round(value) })).sort((a, b) => b.value - a.value),
      expenses: d.ds.expenses.filter((e) => e.productCategoryId === id).reduce((a, e) => a + e.amount, 0),
    };
    return detail;
  },

  async listBrands() {
    await latency();
    const d = derived();
    return d.ds.brands.map((b): BrandSummary => {
      const items = d.inventory.filter((i) => i.brandId === b.id);
      return {
        ...b,
        products: items.length,
        stockValue: items.reduce((a, i) => a + i.stockValue, 0),
        revenue90: items.reduce((a, i) => a + i.revenue90, 0),
        marginPercent: weightedMargin(items),
        vendorNames: d.ds.vendors.filter((v) => v.brandIds.includes(b.id)).map((v) => v.name),
        categoryNames: [...new Set(items.map((i) => i.categoryName))],
        movement: movementCounts(items),
      };
    });
  },

  async listCategoryOptions() {
    return derived().ds.categories.map((c) => ({ id: c.id, name: c.name }));
  },

  async listBrandOptions() {
    return derived().ds.brands.map((b) => ({ id: b.id, name: b.name })).sort((a, b) => a.name.localeCompare(b.name));
  },
};

export function inventoryOverview(): InventoryOverview {
  const d = derived();
  const items = d.inventory;
  const ageingBucket = (age: number | null): InventoryOverview["ageing"][number]["bucket"] =>
    age === null || age <= 30 ? "0-30" : age <= 90 ? "31-90" : age <= 180 ? "91-180" : "180+";
  const ageing = (["0-30", "31-90", "91-180", "180+"] as const).map((bucket) => {
    const inBucket = items.filter((i) => i.stockOnHand > 0 && ageingBucket(i.avgStockAgeDays) === bucket);
    return { bucket, stockValue: inBucket.reduce((a, i) => a + i.stockValue, 0), units: inBucket.reduce((a, i) => a + i.stockOnHand, 0) };
  });
  return {
    totalProducts: items.length,
    stockUnits: items.reduce((a, i) => a + i.stockOnHand, 0),
    stockValue: items.reduce((a, i) => a + i.stockValue, 0),
    retailValue: items.reduce((a, i) => a + i.retailValue, 0),
    lowStockCount: items.filter((i) => i.lowStock).length,
    outOfStockCount: items.filter((i) => i.stockOnHand === 0 && i.status !== "discontinued").length,
    onOrderUnits: items.reduce((a, i) => a + i.onOrder, 0),
    movement: MOVEMENTS.map((movement) => {
      const m = items.filter((i) => i.movement === movement);
      return { movement, products: m.length, stockValue: m.reduce((a, i) => a + i.stockValue, 0), units: m.reduce((a, i) => a + i.stockOnHand, 0) };
    }),
    byCategory: d.ds.categories.map((c) => {
      const m = items.filter((i) => i.categoryId === c.id);
      return {
        categoryId: c.id,
        categoryName: c.name,
        stockValue: m.reduce((a, i) => a + i.stockValue, 0),
        units: m.reduce((a, i) => a + i.stockOnHand, 0),
        slowValue: m.filter((i) => i.movement === "slow" || i.movement === "dead").reduce((a, i) => a + i.stockValue, 0),
      };
    }),
    ageing,
  };
}

export const dummyInventoryRepository: InventoryRepository = {
  async listInventory() {
    await latency();
    return derived().inventory;
  },
  async getOverview() {
    await latency();
    return inventoryOverview();
  },
  async listStockMovements(range, type) {
    await latency();
    const d = derived();
    const rows: StockMovementRow[] = [];
    for (const [productId, state] of d.stockStates) {
      const item = d.inventoryById.get(productId)!;
      for (const e of state.ledger) {
        if (!isWithin(e.date, range.from, range.to)) continue;
        if (type && e.type !== type) continue;
        rows.push({ ...e, productName: item.name, sku: item.sku, categoryName: item.categoryName });
      }
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  },
  async listDecisions() {
    await latency();
    return allDecisions();
  },
};


