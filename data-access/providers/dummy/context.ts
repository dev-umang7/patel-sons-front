/**
 * Derived indexes over the dummy dataset, computed once and memoised.
 * Only the dummy provider uses this; an API provider would compute these server-side.
 */
import { getDummyDataset } from "@/dummy-data";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { billCost, billNetTotal, lineNetAfterBillDiscounts } from "../../calculations/bills";
import { ageingBucket, receivableStatus } from "../../calculations/collections";
import { buildStockStates, type ProductStockState } from "../../calculations/inventory";
import { isLowMargin, marginPercent, measureMovement } from "../../calculations/movement";
import { LOYALTY_RULES, MOVEMENT_RULES } from "../../rules/assumptions";
import type { Product } from "../../types/catalog";
import type { ID } from "../../types/common";
import type { LoyaltyTier } from "../../types/crm";
import type { Dataset } from "../../types/dataset";
import type { Bill, CollectionNote, CollectionPayment } from "../../types/sales";
import type { InventoryItem, ReceivableView } from "../../types/views";

/** One sold line with bill-level discounts spread in. */
export interface SaleLine {
  billId: ID;
  date: ISODate;
  customerId: ID | null;
  productId: ID;
  categoryId: ID;
  brandId: ID;
  quantity: number;
  revenue: number;
  cost: number;
}

export interface Derived {
  ds: Dataset;
  asOf: ISODate;
  productById: Map<ID, Product>;
  categoryName: (id: ID) => string;
  brandName: (id: ID) => string;
  vendorName: (id: ID) => string;
  customerName: (id: ID | null) => string | null;
  billById: Map<ID, Bill>;
  billsAsc: Bill[];
  saleLines: SaleLine[];
  stockStates: Map<ID, ProductStockState>;
  inventory: InventoryItem[];
  inventoryById: Map<ID, InventoryItem>;
  receivables: ReceivableView[];
  pointsBalance: Map<ID, number>;
  spend12m: Map<ID, number>;
  tierFor: (customerId: ID) => LoyaltyTier;
  nextTierFor: (customerId: ID) => { name: string; remaining: number } | null;
  vendorIdsForProduct: (productId: ID) => ID[];
}

function build(ds: Dataset): Derived {
  const asOf = ds.meta.asOf;
  const productById = new Map(ds.products.map((p) => [p.id, p]));
  const categoryById = new Map(ds.categories.map((c) => [c.id, c]));
  const brandById = new Map(ds.brands.map((b) => [b.id, b]));
  const vendorById = new Map(ds.vendors.map((v) => [v.id, v]));
  const customerById = new Map(ds.customers.map((c) => [c.id, c]));
  const billsAsc = [...ds.bills].sort((a, b) => a.date.localeCompare(b.date));
  const billById = new Map(billsAsc.map((b) => [b.id, b]));

  const saleLines: SaleLine[] = [];
  for (const bill of billsAsc) {
    for (const item of bill.items) {
      const product = productById.get(item.productId)!;
      saleLines.push({
        billId: bill.id,
        date: bill.date,
        customerId: bill.customerId,
        productId: item.productId,
        categoryId: product.categoryId,
        brandId: product.brandId,
        quantity: item.quantity,
        revenue: lineNetAfterBillDiscounts(bill, item),
        cost: item.quantity * item.unitCost,
      });
    }
  }

  const stockStates = buildStockStates({
    openingStock: ds.openingStock,
    purchases: ds.purchases,
    bills: billsAsc,
    adjustments: ds.stockAdjustments,
    asOf,
  });

  const quoteVendors = new Map<ID, ID[]>();
  for (const q of ds.sourceQuotes) quoteVendors.set(q.productId, [...(quoteVendors.get(q.productId) ?? []), q.vendorId]);

  const from30 = addDays(asOf, -29);
  const from90 = addDays(asOf, -(MOVEMENT_RULES.velocityWindowDays - 1));
  const sold30 = new Map<ID, number>();
  const sold90 = new Map<ID, number>();
  const rev90 = new Map<ID, number>();
  for (const l of saleLines) {
    if (l.date >= from90) {
      sold90.set(l.productId, (sold90.get(l.productId) ?? 0) + l.quantity);
      rev90.set(l.productId, (rev90.get(l.productId) ?? 0) + l.revenue);
    }
    if (l.date >= from30) sold30.set(l.productId, (sold30.get(l.productId) ?? 0) + l.quantity);
  }

  const inventory: InventoryItem[] = ds.products.map((p) => {
    const s = stockStates.get(p.id)!;
    const daysSinceLastSale = s.lastSaleOn ? diffDays(s.lastSaleOn, asOf) : null;
    const units90 = sold90.get(p.id) ?? 0;
    const m = measureMovement({ stockOnHand: s.stockOnHand, unitsSoldInWindow: units90, daysSinceLastSale });
    const margin = marginPercent(p.sellingPrice, s.avgUnitCost);
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: categoryById.get(p.categoryId)!.name,
      brandId: p.brandId,
      brandName: brandById.get(p.brandId)!.name,
      status: p.status,
      unit: p.unit,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      avgUnitCost: Math.round(s.avgUnitCost),
      marginPercent: margin,
      stockOnHand: s.stockOnHand,
      onOrder: s.onOrder,
      reorderLevel: p.reorderLevel,
      stockValue: Math.round(s.stockOnHand * s.avgUnitCost),
      retailValue: s.stockOnHand * p.sellingPrice,
      unitsSold30: sold30.get(p.id) ?? 0,
      unitsSold90: units90,
      revenue90: Math.round(rev90.get(p.id) ?? 0),
      dailyVelocity: m.dailyVelocity,
      daysOfCover: m.daysOfCover,
      lastSaleOn: s.lastSaleOn ?? null,
      daysSinceLastSale,
      lastPurchaseOn: s.lastReceiptOn ?? null,
      lastPurchaseCost: s.lastReceiptCost ?? null,
      lastVendorId: s.lastVendorId ?? null,
      lastVendorName: s.lastVendorId ? vendorById.get(s.lastVendorId)!.name : null,
      avgStockAgeDays: s.avgAgeDays,
      oldestStockOn: s.oldestLayerOn ?? null,
      movement: m.movement,
      lowStock: p.status !== "discontinued" && s.stockOnHand <= p.reorderLevel,
      lowMargin: isLowMargin(margin),
      giftable: p.giftable,
      giftOccasions: p.giftOccasions,
      vendorIds: quoteVendors.get(p.id) ?? [],
    };
  });

  // Receivables
  const paymentsBy = new Map<ID, CollectionPayment[]>();
  for (const pay of ds.collectionPayments) paymentsBy.set(pay.receivableId, [...(paymentsBy.get(pay.receivableId) ?? []), pay]);
  const notesBy = new Map<ID, CollectionNote[]>();
  for (const n of ds.collectionNotes) notesBy.set(n.receivableId, [...(notesBy.get(n.receivableId) ?? []), n]);

  const receivables: ReceivableView[] = ds.receivables.map((r) => {
    const customer = customerById.get(r.customerId)!;
    const payments = (paymentsBy.get(r.id) ?? []).sort((a, b) => a.date.localeCompare(b.date));
    const notes = (notesBy.get(r.id) ?? []).sort((a, b) => b.date.localeCompare(a.date));
    const paid = payments.reduce((a, p) => a + p.amount, 0);
    const outstanding = Math.max(0, Math.round(r.amount - paid));
    const status = receivableStatus(outstanding, r.dueOn, asOf);
    const daysOverdue = Math.max(0, diffDays(r.dueOn, asOf));
    const promisedOn = notes.find((n) => n.promisedOn)?.promisedOn ?? null;
    const last = payments[payments.length - 1];
    return {
      id: r.id,
      customerId: r.customerId,
      customerName: customer.businessName ?? customer.name,
      customerType: customer.type,
      phone: customer.phone,
      billId: r.billId,
      billNumber: billById.get(r.billId)!.number,
      amount: Math.round(r.amount),
      paid: Math.round(paid),
      outstanding,
      issuedOn: r.issuedOn,
      dueOn: r.dueOn,
      daysOverdue: outstanding > 0 ? daysOverdue : 0,
      status,
      bucket: outstanding > 0 ? ageingBucket(daysOverdue) : "not-due",
      lastPaymentOn: last?.date ?? null,
      lastPaymentAmount: last?.amount ?? null,
      promisedOn,
      nextAction: nextAction(status, promisedOn, asOf),
      payments,
      notes,
    };
  });

  // Loyalty
  const pointsBalance = new Map<ID, number>();
  for (const e of ds.loyaltyEntries) pointsBalance.set(e.customerId, (pointsBalance.get(e.customerId) ?? 0) + e.points);
  const windowFrom = addDays(asOf, -(LOYALTY_RULES.tierWindowDays - 1));
  const spend12m = new Map<ID, number>();
  for (const b of billsAsc) {
    if (!b.customerId || b.date < windowFrom) continue;
    spend12m.set(b.customerId, (spend12m.get(b.customerId) ?? 0) + billNetTotal(b));
  }
  const tiersAsc = [...ds.loyaltyTiers].sort((a, b) => a.minAnnualSpend - b.minAnnualSpend);
  const tierFor = (customerId: ID) => {
    const spend = spend12m.get(customerId) ?? 0;
    let tier = tiersAsc[0];
    for (const t of tiersAsc) if (spend >= t.minAnnualSpend) tier = t;
    return tier;
  };
  const nextTierFor = (customerId: ID) => {
    const spend = spend12m.get(customerId) ?? 0;
    const next = tiersAsc.find((t) => t.minAnnualSpend > spend);
    return next ? { name: next.name, remaining: Math.round(next.minAnnualSpend - spend) } : null;
  };

  return {
    ds,
    asOf,
    productById,
    categoryName: (id) => categoryById.get(id)?.name ?? "Unknown category",
    brandName: (id) => brandById.get(id)?.name ?? "Unknown brand",
    vendorName: (id) => vendorById.get(id)?.name ?? "Unknown vendor",
    customerName: (id) => {
      if (!id) return null;
      const c = customerById.get(id);
      return c ? (c.businessName ?? c.name) : null;
    },
    billById,
    billsAsc,
    saleLines,
    stockStates,
    inventory,
    inventoryById: new Map(inventory.map((i) => [i.productId, i])),
    receivables,
    pointsBalance,
    spend12m,
    tierFor,
    nextTierFor,
    vendorIdsForProduct: (productId) => quoteVendors.get(productId) ?? [],
  };
}

function nextAction(status: ReceivableView["status"], promisedOn: ISODate | null, asOf: ISODate): string {
  if (status === "paid") return "Settled";
  if (promisedOn && promisedOn >= asOf) return `Promised by ${formatDate(promisedOn)}`;
  if (promisedOn && promisedOn < asOf) return "Promise missed — escalate";
  switch (status) {
    case "critical":
      return "Escalate — visit in person";
    case "overdue":
      return "Call for payment";
    case "due-soon":
      return "Send reminder";
    default:
      return "No action needed yet";
  }
}

const cache = globalThis as typeof globalThis & { __patelSonsDerived?: Derived };

export function derived(): Derived {
  cache.__patelSonsDerived ??= build(getDummyDataset());
  return cache.__patelSonsDerived;
}

/** Simulates network latency so loading states are exercised in development. */
export async function latency(): Promise<void> {
  const ms = Number(process.env.DUMMY_LATENCY_MS ?? 0);
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

export function billProfit(b: Bill): number {
  return billNetTotal(b) - billCost(b);
}
