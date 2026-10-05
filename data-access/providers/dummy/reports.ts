import { diffDays, eachDay, eachMonth, isWithin, monthOf, weekdayOf, type ISODate } from "@/lib/dates";
import { formatCurrencyCompact, formatSignedPercent, pluralize } from "@/lib/format";
import { bucketOf, type Granularity } from "@/lib/period";
import { percentChange } from "@/lib/utils";
import { billDiscounts, billNetTotal } from "../../calculations/bills";
import { isLowMargin } from "../../calculations/movement";
import { offerStatus } from "../../calculations/offers";
import type { ReportPeriod, ReportRepository } from "../../contracts";
import { MARGIN_RULES, OFFER_RULES } from "../../rules/assumptions";
import type { DateRange, ID } from "../../types/common";
import type { ExpenseCategory } from "../../types/finance";
import type { PaymentMode } from "../../types/sales";
import type {
  CategoryPerformance,
  DashboardData,
  ExpenseReport,
  ManagementAlert,
  PeriodTotals,
  ProductPerformance,
  ProfitReport,
  PurchaseReport,
  ReportFilters,
  SalesReport,
  TrendPoint,
} from "../../types/views";
import { derived, latency, type SaleLine } from "./context";
import { inventoryOverview } from "./inventory";
import { allVendorSummaries, toOfferView, toPurchaseSummary } from "./procurement";
import { collectionsOverview } from "./sales";

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  rent: "Rent",
  salaries: "Salaries",
  utilities: "Utilities",
  freight: "Inward freight",
  marketing: "Marketing",
  packaging: "Packaging",
  maintenance: "Maintenance",
  "bank-charges": "Bank charges",
  miscellaneous: "Miscellaneous",
};

const hasFilters = (f?: ReportFilters) => !!f && Object.values(f).some(Boolean);

function linesIn(range: DateRange, filters?: ReportFilters): SaleLine[] {
  const d = derived();
  const vendorProducts = filters?.vendorId ? new Set(d.inventory.filter((i) => i.vendorIds.includes(filters.vendorId!)).map((i) => i.productId)) : null;
  return d.saleLines.filter(
    (l) =>
      isWithin(l.date, range.from, range.to) &&
      (!filters?.categoryId || l.categoryId === filters.categoryId) &&
      (!filters?.brandId || l.brandId === filters.brandId) &&
      (!filters?.productId || l.productId === filters.productId) &&
      (!filters?.customerId || l.customerId === filters.customerId) &&
      (!vendorProducts || vendorProducts.has(l.productId)),
  );
}

interface ReceiptLine {
  date: ISODate;
  purchaseId: ID;
  vendorId: ID;
  productId: ID;
  categoryId: ID;
  brandId: ID;
  quantity: number;
  value: number;
  savings: number;
}

let receiptCache: ReceiptLine[] | null = null;
function receiptLines(): ReceiptLine[] {
  if (receiptCache) return receiptCache;
  const d = derived();
  receiptCache = d.ds.purchases.flatMap((p) =>
    p.receipts.map((r) => {
      const item = p.items.find((i) => i.productId === r.productId)!;
      const product = d.productById.get(r.productId)!;
      return {
        date: r.date,
        purchaseId: p.id,
        vendorId: p.vendorId,
        productId: r.productId,
        categoryId: product.categoryId,
        brandId: product.brandId,
        quantity: r.quantity,
        value: r.quantity * item.unitCost,
        savings: r.quantity * (item.listUnitCost - item.unitCost),
      };
    }),
  );
  return receiptCache;
}

function receiptsIn(range: DateRange, filters?: ReportFilters): ReceiptLine[] {
  return receiptLines().filter(
    (r) =>
      isWithin(r.date, range.from, range.to) &&
      (!filters?.categoryId || r.categoryId === filters.categoryId) &&
      (!filters?.brandId || r.brandId === filters.brandId) &&
      (!filters?.productId || r.productId === filters.productId) &&
      (!filters?.vendorId || r.vendorId === filters.vendorId),
  );
}

function expensesIn(range: DateRange) {
  return derived().ds.expenses.filter((e) => isWithin(e.date, range.from, range.to));
}

function totals(range: DateRange, filters?: ReportFilters): PeriodTotals {
  const d = derived();
  const lines = linesIn(range, filters);
  const billIds = new Set(lines.map((l) => l.billId));
  const revenue = lines.reduce((a, l) => a + l.revenue, 0);
  const cogs = lines.reduce((a, l) => a + l.cost, 0);
  const grossProfit = revenue - cogs;
  const filtered = hasFilters(filters);
  const bills = [...billIds].map((id) => d.billById.get(id)!);
  const expenses = filtered ? 0 : expensesIn(range).reduce((a, e) => a + e.amount, 0);
  const firstBill = new Map<ID, ISODate>();
  for (const b of d.billsAsc) if (b.customerId && !firstBill.has(b.customerId)) firstBill.set(b.customerId, b.date);
  const netProfit = grossProfit - expenses;
  return {
    range,
    revenue: Math.round(revenue),
    cogs: Math.round(cogs),
    grossProfit: Math.round(grossProfit),
    grossMarginPercent: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    bills: billIds.size,
    units: lines.reduce((a, l) => a + l.quantity, 0),
    avgBill: billIds.size ? revenue / billIds.size : 0,
    discounts: filtered ? 0 : bills.reduce((a, b) => a + billDiscounts(b), 0),
    purchases: Math.round(receiptsIn(range, filters).reduce((a, r) => a + r.value, 0)),
    expenses,
    netProfit: Math.round(netProfit),
    netMarginPercent: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    newCustomers: [...firstBill.values()].filter((date) => isWithin(date, range.from, range.to)).length,
    creditSales: Math.round(bills.filter((b) => b.paymentMode === "credit").reduce((a, b) => a + billNetTotal(b), 0)),
  };
}

function bucketKeys(range: DateRange, granularity: Granularity): string[] {
  const keys: string[] = [];
  for (const day of eachDay(range.from, range.to)) {
    const k = bucketOf(day, granularity);
    if (keys[keys.length - 1] !== k) keys.push(k);
  }
  return keys;
}

function trend(period: ReportPeriod, filters?: ReportFilters): TrendPoint[] {
  const keys = bucketKeys(period.range, period.granularity);
  const prevKeys = bucketKeys(period.previous, period.granularity);
  const acc = new Map(keys.map((k) => [k, { revenue: 0, cost: 0, bills: new Set<ID>(), units: 0 }]));
  for (const l of linesIn(period.range, filters)) {
    const a = acc.get(bucketOf(l.date, period.granularity))!;
    a.revenue += l.revenue;
    a.cost += l.cost;
    a.bills.add(l.billId);
    a.units += l.quantity;
  }
  const prev = new Map(prevKeys.map((k) => [k, 0]));
  for (const l of linesIn(period.previous, filters)) {
    const k = bucketOf(l.date, period.granularity);
    if (prev.has(k)) prev.set(k, prev.get(k)! + l.revenue);
  }
  return keys.map((bucket, i) => {
    const a = acc.get(bucket)!;
    const p = prevKeys[i];
    return {
      bucket,
      revenue: Math.round(a.revenue),
      grossProfit: Math.round(a.revenue - a.cost),
      bills: a.bills.size,
      units: a.units,
      previousRevenue: p !== undefined ? Math.round(prev.get(p) ?? 0) : undefined,
    };
  });
}

function categoryPerformance(period: ReportPeriod): CategoryPerformance[] {
  const d = derived();
  const lines = linesIn(period.range);
  const prevLines = linesIn(period.previous);
  const receipts = receiptsIn(period.range);
  const expenses = expensesIn(period.range);
  const total = lines.reduce((a, l) => a + l.revenue, 0);
  return d.ds.categories
    .map((c) => {
      const m = lines.filter((l) => l.categoryId === c.id);
      const revenue = m.reduce((a, l) => a + l.revenue, 0);
      const gp = revenue - m.reduce((a, l) => a + l.cost, 0);
      const items = d.inventory.filter((i) => i.categoryId === c.id);
      return {
        categoryId: c.id,
        name: c.name,
        revenue: Math.round(revenue),
        grossProfit: Math.round(gp),
        marginPercent: revenue > 0 ? (gp / revenue) * 100 : 0,
        units: m.reduce((a, l) => a + l.quantity, 0),
        purchases: Math.round(receipts.filter((r) => r.categoryId === c.id).reduce((a, r) => a + r.value, 0)),
        stockValue: items.reduce((a, i) => a + i.stockValue, 0),
        share: total > 0 ? (revenue / total) * 100 : 0,
        products: items.length,
        slowCount: items.filter((i) => i.movement === "slow").length,
        deadCount: items.filter((i) => i.movement === "dead").length,
        fastCount: items.filter((i) => i.movement === "fast").length,
        expensesAllocated: expenses.filter((e) => e.productCategoryId === c.id).reduce((a, e) => a + e.amount, 0),
        previousRevenue: Math.round(prevLines.filter((l) => l.categoryId === c.id).reduce((a, l) => a + l.revenue, 0)),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

function productPerformance(range: DateRange, filters?: ReportFilters): ProductPerformance[] {
  const d = derived();
  const map = new Map<ID, { units: number; revenue: number; cost: number }>();
  for (const l of linesIn(range, filters)) {
    const a = map.get(l.productId) ?? { units: 0, revenue: 0, cost: 0 };
    a.units += l.quantity;
    a.revenue += l.revenue;
    a.cost += l.cost;
    map.set(l.productId, a);
  }
  return d.inventory
    .filter((i) => !filters?.categoryId || i.categoryId === filters.categoryId)
    .filter((i) => !filters?.brandId || i.brandId === filters.brandId)
    .map((i) => {
      const a = map.get(i.productId) ?? { units: 0, revenue: 0, cost: 0 };
      return {
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        categoryName: i.categoryName,
        brandName: i.brandName,
        units: a.units,
        revenue: Math.round(a.revenue),
        grossProfit: Math.round(a.revenue - a.cost),
        marginPercent: a.revenue > 0 ? ((a.revenue - a.cost) / a.revenue) * 100 : i.marginPercent,
        movement: i.movement,
      };
    });
}

function salesReport(period: ReportPeriod, filters?: ReportFilters): SalesReport {
  const d = derived();
  const lines = linesIn(period.range, filters);
  const products = productPerformance(period.range, filters);
  const customers = new Map<ID, { bills: Set<ID>; revenue: number; cost: number }>();
  for (const l of lines) {
    if (!l.customerId) continue;
    const a = customers.get(l.customerId) ?? { bills: new Set<ID>(), revenue: 0, cost: 0 };
    a.bills.add(l.billId);
    a.revenue += l.revenue;
    a.cost += l.cost;
    customers.set(l.customerId, a);
  }
  const billIds = new Set(lines.map((l) => l.billId));
  const bills = [...billIds].map((id) => d.billById.get(id)!);
  const revenueByBill = new Map<ID, number>();
  for (const l of lines) revenueByBill.set(l.billId, (revenueByBill.get(l.billId) ?? 0) + l.revenue);

  const modes: PaymentMode[] = ["upi", "cash", "card", "credit"];
  const weekday = Array.from({ length: 7 }, (_, i) => ({ weekday: i, revenue: 0, bills: 0 }));
  for (const b of bills) {
    const w = weekday[weekdayOf(b.date)];
    w.revenue += revenueByBill.get(b.id) ?? 0;
    w.bills++;
  }
  const gift = bills.filter((b) => b.kind === "gift");
  const sold = products.filter((p) => p.units > 0);
  return {
    totals: totals(period.range, filters),
    previous: totals(period.previous, filters),
    trend: trend(period, filters),
    byCategory: categoryPerformance(period).filter((c) => !filters?.categoryId || c.categoryId === filters.categoryId),
    topProducts: [...sold].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    bottomProducts: [...products].filter((p) => p.revenue >= 0).sort((a, b) => a.revenue - b.revenue).slice(0, 10),
    topCustomers: [...customers]
      .map(([customerId, a]) => ({ customerId, name: d.customerName(customerId)!, type: d.ds.customers.find((c) => c.id === customerId)!.type, bills: a.bills.size, revenue: Math.round(a.revenue), grossProfit: Math.round(a.revenue - a.cost) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    byPaymentMode: modes.map((mode) => {
      const m = bills.filter((b) => b.paymentMode === mode);
      return { mode, bills: m.length, amount: Math.round(m.reduce((a, b) => a + (revenueByBill.get(b.id) ?? 0), 0)) };
    }),
    byWeekday: weekday.map((w) => ({ ...w, revenue: Math.round(w.revenue) })),
    giftBills: { bills: gift.length, revenue: Math.round(gift.reduce((a, b) => a + (revenueByBill.get(b.id) ?? 0), 0)) },
  };
}

function priceChanges(): DashboardData["priceChanges"] {
  const d = derived();
  const now = monthOf(d.asOf);
  const then = eachMonth(d.ds.meta.historyStart, d.asOf).at(-7) ?? now;
  const obs = new Map(d.ds.costObservations.map((c) => [`${c.productId}|${c.vendorId}|${c.month}`, c.unitCost]));
  const out: DashboardData["priceChanges"] = [];
  for (const i of d.inventory) {
    if (!i.lastVendorId || i.status === "discontinued") continue;
    const from = obs.get(`${i.productId}|${i.lastVendorId}|${then}`);
    const to = obs.get(`${i.productId}|${i.lastVendorId}|${now}`);
    if (!from || !to) continue;
    const change = ((to - from) / from) * 100;
    if (Math.abs(change) >= 1) out.push({ productId: i.productId, name: i.name, vendorName: i.lastVendorName!, from, to, changePercent: change });
  }
  return out.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6);
}

function alerts(current: PeriodTotals, previous: PeriodTotals): ManagementAlert[] {
  const d = derived();
  const out: ManagementAlert[] = [];
  const nonMoving = d.inventory.filter((i) => (i.movement === "slow" || i.movement === "dead") && i.stockOnHand > 0);
  const collections = collectionsOverview();
  const offers = d.ds.vendorOffers.map((o) => ({ o, status: offerStatus(o, d.asOf) }));
  const expiring = offers.filter((x) => x.status === "expiring");
  const startingSoon = offers.filter((x) => x.status === "upcoming" && diffDays(d.asOf, x.o.startsOn) <= OFFER_RULES.expiringSoonDays);
  const lowMargin = d.inventory.filter((i) => i.lowMargin && i.status !== "discontinued");
  const lowStockFast = d.inventory.filter((i) => i.lowStock && (i.movement === "fast" || i.movement === "normal"));
  const late = d.ds.purchases.filter((p) => (p.status === "ordered" || p.status === "partially-received") && p.expectedOn < d.asOf);
  const drafts = d.ds.purchases.filter((p) => p.status === "draft");

  if (collections.criticalAmount > 0) {
    const critical = collections.byCustomer.filter((c) => c.worstStatus === "critical").length;
    out.push({ id: "debt-critical", severity: "critical", title: `${formatCurrencyCompact(collections.criticalAmount)} overdue by more than 60 days`, detail: `${pluralize(critical, "customer")} ${critical === 1 ? "needs" : "need"} escalation.`, href: "/sales/collections?status=critical", metric: formatCurrencyCompact(collections.criticalAmount) });
  }
  if (collections.overdueAmount > 0) {
    out.push({ id: "debt-overdue", severity: "warning", title: `${formatCurrencyCompact(collections.totalOutstanding)} outstanding across ${pluralize(collections.customersOwing, "customer")}`, detail: `${formatCurrencyCompact(collections.overdueAmount)} of it is past due.`, href: "/sales/collections", metric: formatCurrencyCompact(collections.totalOutstanding) });
  }
  if (lowStockFast.length > 0) {
    out.push({ id: "low-stock", severity: "warning", title: `${pluralize(lowStockFast.length, "selling product")} at or below re-order level`, detail: lowStockFast.slice(0, 3).map((i) => i.name).join(", ") + (lowStockFast.length > 3 ? "…" : ""), href: "/inventory/products?view=low-stock", metric: String(lowStockFast.length) });
  }
  if (nonMoving.length > 0) {
    out.push({ id: "slow", severity: "warning", title: `${pluralize(nonMoving.length, "product")} slow or not moving`, detail: `${formatCurrencyCompact(nonMoving.reduce((a, i) => a + i.stockValue, 0))} of stock tied up.`, href: "/inventory/slow-moving", metric: String(nonMoving.length) });
  }
  if (expiring.length > 0) {
    out.push({ id: "offers-expiring", severity: "warning", title: `${pluralize(expiring.length, "vendor offer")} ${expiring.length === 1 ? "expires" : "expire"} within ${OFFER_RULES.expiringSoonDays} days`, detail: expiring.map((x) => x.o.title).join(", "), href: "/procurement/offers", metric: String(expiring.length) });
  }
  if (late.length > 0) {
    out.push({ id: "po-late", severity: "warning", title: `${pluralize(late.length, "purchase order")} past expected delivery`, detail: late.map((p) => `${p.number} · ${d.vendorName(p.vendorId)}`).join(", "), href: "/procurement/orders", metric: String(late.length) });
  }
  if (lowMargin.length > 0) {
    out.push({ id: "low-margin", severity: "info", title: `${pluralize(lowMargin.length, "product")} below ${MARGIN_RULES.lowMarginPercent}% margin`, detail: "Review buying price or selling price.", href: "/reports/profit", metric: String(lowMargin.length) });
  }
  if (startingSoon.length > 0) {
    out.push({ id: "offers-upcoming", severity: "info", title: `${pluralize(startingSoon.length, "vendor offer")} starting within ${OFFER_RULES.expiringSoonDays} days`, detail: startingSoon.map((x) => x.o.title).join(", "), href: "/procurement/offers", metric: String(startingSoon.length) });
  }
  if (drafts.length > 0) {
    out.push({ id: "po-drafts", severity: "info", title: `${pluralize(drafts.length, "draft purchase order")} awaiting a decision`, detail: drafts.map((p) => d.vendorName(p.vendorId)).join(", "), href: "/procurement/orders", metric: String(drafts.length) });
  }
  const change = percentChange(current.revenue, previous.revenue);
  if (change !== null && change > 0) {
    out.push({ id: "revenue-up", severity: "positive", title: `Sales up ${formatSignedPercent(change)} on the previous period`, detail: `${formatCurrencyCompact(current.revenue)} vs ${formatCurrencyCompact(previous.revenue)}.`, href: "/reports/sales" });
  }
  return out;
}

export const dummyReportRepository: ReportRepository = {
  async getDashboard(period) {
    await latency();
    const d = derived();
    const current = totals(period.range);
    const previous = totals(period.previous);
    const products = productPerformance(period.range);
    const purchases = d.ds.purchases.map(toPurchaseSummary);
    const data: DashboardData = {
      totals: current,
      previous,
      trend: trend(period),
      topCategories: categoryPerformance(period),
      topProducts: [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      inventory: inventoryOverview(),
      fastMovers: d.inventory.filter((i) => i.movement === "fast").sort((a, b) => b.unitsSold90 - a.unitsSold90).slice(0, 6),
      slowMovers: d.inventory.filter((i) => (i.movement === "slow" || i.movement === "dead") && i.stockOnHand > 0).sort((a, b) => b.stockValue - a.stockValue).slice(0, 6),
      lowStock: d.inventory.filter((i) => i.lowStock).sort((a, b) => b.dailyVelocity - a.dailyVelocity).slice(0, 6),
      recentPurchases: purchases.filter((p) => p.status === "received").sort((a, b) => (b.receivedOn ?? "").localeCompare(a.receivedOn ?? "")).slice(0, 6),
      openOrders: purchases.filter((p) => ["draft", "ordered", "partially-received"].includes(p.status)).sort((a, b) => a.expectedOn.localeCompare(b.expectedOn)),
      vendorPerformance: [...allVendorSummaries()].sort((a, b) => b.purchaseValue - a.purchaseValue).slice(0, 5),
      liveOffers: d.ds.vendorOffers
        .map(toOfferView)
        .filter((o) => o.status === "active" || o.status === "expiring" || (o.status === "upcoming" && o.daysToStart <= 14))
        .sort((a, b) => a.endsOn.localeCompare(b.endsOn)),
      priceChanges: priceChanges(),
      collections: collectionsOverview(),
      alerts: alerts(current, previous),
    };
    return data;
  },

  async getSalesReport(period, filters) {
    await latency();
    return salesReport(period, filters);
  },

  async getPurchaseReport(period, filters) {
    await latency();
    const d = derived();
    const lines = receiptsIn(period.range, filters);
    const total = lines.reduce((a, r) => a + r.value, 0);
    const vendorMap = new Map<ID, { orders: Set<ID>; units: number; value: number; savings: number }>();
    const catMap = new Map<ID, { value: number; units: number }>();
    const prodMap = new Map<ID, { units: number; value: number }>();
    for (const r of lines) {
      const v = vendorMap.get(r.vendorId) ?? { orders: new Set<ID>(), units: 0, value: 0, savings: 0 };
      v.orders.add(r.purchaseId);
      v.units += r.quantity;
      v.value += r.value;
      v.savings += r.savings;
      vendorMap.set(r.vendorId, v);
      const c = catMap.get(r.categoryId) ?? { value: 0, units: 0 };
      c.value += r.value;
      c.units += r.quantity;
      catMap.set(r.categoryId, c);
      const p = prodMap.get(r.productId) ?? { units: 0, value: 0 };
      p.units += r.quantity;
      p.value += r.value;
      prodMap.set(r.productId, p);
    }
    const keys = bucketKeys(period.range, period.granularity);
    const byBucket = new Map(keys.map((k) => [k, 0]));
    for (const r of lines) {
      const k = bucketOf(r.date, period.granularity);
      byBucket.set(k, (byBucket.get(k) ?? 0) + r.value);
    }
    const report: PurchaseReport = {
      total: Math.round(total),
      previousTotal: Math.round(receiptsIn(period.previous, filters).reduce((a, r) => a + r.value, 0)),
      orders: new Set(lines.map((r) => r.purchaseId)).size,
      units: lines.reduce((a, r) => a + r.quantity, 0),
      savings: Math.round(lines.reduce((a, r) => a + r.savings, 0)),
      byVendor: [...vendorMap]
        .map(([vendorId, v]) => ({ vendorId, name: d.vendorName(vendorId), orders: v.orders.size, units: v.units, value: Math.round(v.value), savings: Math.round(v.savings), share: total > 0 ? (v.value / total) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
      byCategory: [...catMap].map(([categoryId, c]) => ({ categoryId, name: d.categoryName(categoryId), value: Math.round(c.value), units: c.units })).sort((a, b) => b.value - a.value),
      byMonth: keys.map((bucket) => ({ bucket, value: Math.round(byBucket.get(bucket) ?? 0) })),
      topProducts: [...prodMap]
        .map(([productId, p]) => ({ productId, name: d.inventoryById.get(productId)!.name, units: p.units, value: Math.round(p.value), avgCost: Math.round(p.value / p.units) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12),
    };
    return report;
  },

  async getProfitReport(period) {
    await latency();
    const d = derived();
    const months = eachMonth(period.range.from, period.range.to);
    const report: ProfitReport = {
      totals: totals(period.range),
      previous: totals(period.previous),
      monthly: months.map((month) => {
        const inMonth = (date: ISODate) => date.startsWith(month) && isWithin(date, period.range.from, period.range.to);
        const lines = d.saleLines.filter((l) => inMonth(l.date));
        const revenue = lines.reduce((a, l) => a + l.revenue, 0);
        const cogs = lines.reduce((a, l) => a + l.cost, 0);
        const expenses = d.ds.expenses.filter((e) => inMonth(e.date)).reduce((a, e) => a + e.amount, 0);
        return { month, revenue: Math.round(revenue), cogs: Math.round(cogs), grossProfit: Math.round(revenue - cogs), expenses, netProfit: Math.round(revenue - cogs - expenses) };
      }),
      byCategory: categoryPerformance(period),
      lowMarginProducts: productPerformance(period.range)
        .filter((p) => p.units > 0 && isLowMargin(p.marginPercent))
        .sort((a, b) => a.marginPercent - b.marginPercent),
    };
    return report;
  },

  async getCategoryReport(period) {
    await latency();
    return categoryPerformance(period);
  },

  async getExpenseReport(period) {
    await latency();
    const d = derived();
    const entries = expensesIn(period.range).sort((a, b) => b.date.localeCompare(a.date));
    const prev = expensesIn(period.previous);
    const total = entries.reduce((a, e) => a + e.amount, 0);
    const categories = Object.keys(EXPENSE_LABEL) as ExpenseCategory[];
    const months = eachMonth(period.range.from, period.range.to);
    const report: ExpenseReport = {
      total,
      previousTotal: prev.reduce((a, e) => a + e.amount, 0),
      byCategory: categories
        .map((category) => {
          const amount = entries.filter((e) => e.category === category).reduce((a, e) => a + e.amount, 0);
          return { category, label: EXPENSE_LABEL[category], amount, share: total > 0 ? (amount / total) * 100 : 0, previousAmount: prev.filter((e) => e.category === category).reduce((a, e) => a + e.amount, 0) };
        })
        .filter((c) => c.amount > 0 || c.previousAmount > 0)
        .sort((a, b) => b.amount - a.amount),
      monthly: months.map((month) => {
        const row: ExpenseReport["monthly"][number] = { month, total: 0 };
        for (const e of entries.filter((x) => x.date.startsWith(month))) {
          row[e.category] = ((row[e.category] as number | undefined) ?? 0) + e.amount;
          row.total += e.amount;
        }
        return row;
      }),
      entries,
      revenue: totals(period.range).revenue,
      allocatedToCategories: d.ds.categories
        .map((c) => ({ categoryId: c.id, name: c.name, amount: entries.filter((e) => e.productCategoryId === c.id).reduce((a, e) => a + e.amount, 0) }))
        .filter((c) => c.amount > 0),
    };
    return report;
  },
};

