/**
 * Day-by-day simulation of one year of trading. Produces internally consistent
 * records: stock never goes negative, every sale draws down received stock,
 * every credit bill becomes a receivable, every receipt traces to a purchase.
 */
import { couponDiscountFor, couponValidOn } from "@/data-access/calculations/coupons";
import { effectiveUnitCost, isOfferLive, meetsOfferQuantity } from "@/data-access/calculations/offers";
import type { PriceRevision } from "@/data-access/types/catalog";
import type { Coupon, LoyaltyEntry, LoyaltyTier } from "@/data-access/types/crm";
import type { OpeningStock, StockAdjustment } from "@/data-access/types/inventory";
import type { Purchase, PurchaseItem, VendorOffer } from "@/data-access/types/procurement";
import type { Bill, BillItem, PaymentMode, Receivable } from "@/data-access/types/sales";
import { addDays, diffDays, eachDay, isWithin, monthOf, weekdayOf, type ISODate } from "@/lib/dates";
import type { ProductSeed } from "../catalog";
import type { CustomerSeed } from "../customers";
import type { VendorSeed } from "../vendors";
import { minOrderQtyFor, vendorsCarrying, type CostBook } from "./pricing";
import type { Rng } from "./random";
import { AS_OF, HISTORY_START, seasonFactor, trafficFactor, trendFactor } from "./seasonality";

/** ASSUMPTION (dummy only): 1 loyalty point per ₹100 spent; 1 point redeems ₹1. */
export const RUPEES_PER_POINT = 100;
const REDEMPTION_POINTS = 500;

/** Overall store volume calibration. */
const DEMAND_SCALE = 1.35;
const REGISTERED_SHARE = 0.58;
const BASKET_SIZES = [
  { n: 1, w: 0.52 },
  { n: 2, w: 0.3 },
  { n: 3, w: 0.13 },
  { n: 4, w: 0.05 },
];
const BULK_CATEGORIES = new Set(["cat-storage", "cat-dinnerware", "cat-cookware", "cat-gifts"]);
const PREBUY_WINDOW = { from: "2026-09-10", to: "2026-09-29" };

export interface SimulationInput {
  rng: Rng;
  products: ProductSeed[];
  vendors: VendorSeed[];
  customers: CustomerSeed[];
  coupons: Coupon[];
  offers: VendorOffer[];
  tiers: LoyaltyTier[];
  revisions: PriceRevision[];
  book: CostBook;
}

export interface SimulationOutput {
  bills: Bill[];
  purchases: Purchase[];
  openingStock: OpeningStock[];
  stockAdjustments: StockAdjustment[];
  loyaltyEntries: LoyaltyEntry[];
  receivables: Receivable[];
  /** Card takings per month, used to derive bank charges. */
  cardSalesByMonth: Map<string, number>;
}

interface PendingReceipt {
  purchase: Purchase;
  item: PurchaseItem;
  quantity: number;
}

function fiscalYear(date: ISODate): string {
  const y = Number(date.slice(0, 4));
  const start = Number(date.slice(5, 7)) >= 4 ? y : y - 1;
  return `${String(start % 100).padStart(2, "0")}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function isDiwaliLinked(p: ProductSeed): boolean {
  return p.sim.season === "diwali" || p.giftOccasions.includes("diwali") || p.categoryId === "cat-gifts";
}

export function simulate(input: SimulationInput): SimulationOutput {
  const { rng, products, vendors, customers, coupons, offers, tiers, revisions, book } = input;
  const productById = new Map(products.map((p) => [p.id, p]));

  const revisionsByProduct = new Map<string, PriceRevision[]>();
  for (const r of [...revisions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))) {
    const list = revisionsByProduct.get(r.productId) ?? [];
    list.push(r);
    revisionsByProduct.set(r.productId, list);
  }
  const priceAt = (productId: string, date: ISODate) => {
    const list = revisionsByProduct.get(productId) ?? [];
    let current = list[0];
    for (const r of list) if (r.effectiveFrom <= date) current = r;
    return current.sellingPrice;
  };

  const stock = new Map<string, number>();
  const onOrder = new Map<string, number>();
  const avgCost = new Map<string, number>();
  const pending = new Map<ISODate, PendingReceipt[]>();
  const receiptDates = new Map<Purchase, ISODate[]>();

  const bills: Bill[] = [];
  const purchases: Purchase[] = [];
  const adjustments: StockAdjustment[] = [];
  const loyalty: LoyaltyEntry[] = [];
  const receivables: Receivable[] = [];
  const openingStock: OpeningStock[] = [];
  const cardSalesByMonth = new Map<string, number>();
  const couponUsage = new Map<string, number>();
  const pointsBalance = new Map<string, number>();
  const spendLog = new Map<string, { date: ISODate; amount: number }[]>();

  let billSeq = 0;
  let adjSeq = 0;
  let loySeq = 0;
  let rcvSeq = 0;

  // ---- Opening stock -------------------------------------------------------
  for (const p of products) {
    const seasonal = p.sim.season === "diwali" ? 4.5 : p.sim.season === "winter" ? 0.8 : p.sim.season === "summer" ? 0.6 : 1;
    const quantity = Math.ceil(p.sim.demand * 30 * seasonal) + (p.sim.overstock ?? 0) + p.reorderLevel;
    const unitCost = Math.min(...vendorsCarrying(p, vendors).map((v) => book.costAt(p.id, v.id, "2025-10")));
    stock.set(p.id, quantity);
    onOrder.set(p.id, 0);
    avgCost.set(p.id, unitCost);
    openingStock.push({ productId: p.id, asOf: HISTORY_START, quantity, unitCost });
  }

  // ---- Helpers ---------------------------------------------------------------
  const tierIndexFor = (customerId: string, date: ISODate) => {
    const from = addDays(date, -365);
    const spend = (spendLog.get(customerId) ?? []).reduce((acc, e) => (e.date >= from ? acc + e.amount : acc), 0);
    let idx = 0;
    tiers.forEach((t, i) => {
      if (spend >= t.minAnnualSpend) idx = i;
    });
    return idx;
  };

  const segmentAllows = (coupon: Coupon, customer: CustomerSeed | null, date: ISODate) => {
    switch (coupon.segment) {
      case "all":
        return true;
      case "loyalty-members":
        return customer !== null;
      case "gold-and-above":
        return customer !== null && tierIndexFor(customer.id, date) >= 2;
      case "business":
        return customer?.type === "business";
    }
  };

  const liveOffer = (vendorId: string, productId: string, date: ISODate, qty: number) =>
    offers.find((o) => o.vendorId === vendorId && o.productIds.includes(productId) && isOfferLive(o, date) && meetsOfferQuantity(o, qty));

  const chooseVendor = (p: ProductSeed, date: ISODate, qty: number) => {
    const candidates = vendorsCarrying(p, vendors);
    const priced = candidates.map((v) => {
      const list = book.costAt(p.id, v.id, monthOf(date));
      return { v, cost: effectiveUnitCost(list, liveOffer(v.id, p.id, date, qty)?.benefit) };
    });
    if (rng.chance(0.72)) return priced.reduce((best, c) => (c.cost < best.cost ? c : best)).v;
    return rng.weighted(candidates, (v) => v.sim.reliability);
  };

  const receive = (r: PendingReceipt, date: ISODate) => {
    const current = stock.get(r.item.productId) ?? 0;
    const avg = avgCost.get(r.item.productId) ?? r.item.unitCost;
    avgCost.set(r.item.productId, (current * avg + r.quantity * r.item.unitCost) / (current + r.quantity));
    stock.set(r.item.productId, current + r.quantity);
    onOrder.set(r.item.productId, (onOrder.get(r.item.productId) ?? 0) - r.quantity);
    r.item.receivedQuantity += r.quantity;
    r.purchase.receipts.push({ date, productId: r.item.productId, quantity: r.quantity });
    const dates = receiptDates.get(r.purchase) ?? [];
    dates.push(date);
    receiptDates.set(r.purchase, dates);
  };

  const schedule = (date: ISODate, receipt: PendingReceipt) => {
    const list = pending.get(date) ?? [];
    list.push(receipt);
    pending.set(date, list);
  };

  // ---- Daily loop -----------------------------------------------------------
  for (const date of eachDay(HISTORY_START, AS_OF)) {
    const t = diffDays(HISTORY_START, date);
    const weekday = weekdayOf(date);

    // 1. Goods arriving today
    for (const r of pending.get(date) ?? []) receive(r, date);

    // 2. Stock adjustments
    if (rng.chance(0.035)) {
      const candidates = products.filter((p) => (stock.get(p.id) ?? 0) >= 3);
      const p = candidates.length > 0 ? rng.pick(candidates) : null;
      if (p) {
      stock.set(p.id, (stock.get(p.id) ?? 0) - 1);
      adjustments.push({ id: `adj-${String(++adjSeq).padStart(4, "0")}`, productId: p.id, date, quantity: -1, reason: "damaged", note: rng.pick(["Display unit damaged", "Breakage while unpacking", "Received damaged in transit"]) });
      }
    }
    if (rng.chance(0.012)) {
      const candidates = products.filter((p) => (stock.get(p.id) ?? 0) >= 4);
      const p = candidates.length > 0 ? rng.pick(candidates) : null;
      const q = rng.int(1, 2);
      if (p) {
      stock.set(p.id, (stock.get(p.id) ?? 0) - q);
      adjustments.push({ id: `adj-${String(++adjSeq).padStart(4, "0")}`, productId: p.id, date, quantity: -q, reason: "vendor-return", note: "Returned to vendor — manufacturing defect" });
      }
    }
    if (addDays(date, 1).slice(8) === "01" && rng.chance(0.5)) {
      const p = rng.pick(products.filter((x) => (stock.get(x.id) ?? 0) >= 2));
      const q = rng.chance(0.5) ? 1 : -1;
      stock.set(p.id, (stock.get(p.id) ?? 0) + q);
      adjustments.push({ id: `adj-${String(++adjSeq).padStart(4, "0")}`, productId: p.id, date, quantity: q, reason: "stock-count", note: "Month-end stock count variance" });
    }

    // 3. Customer demand → bills
    const pool: string[] = [];
    for (const p of products) {
      const lambda = DEMAND_SCALE * p.sim.demand * trafficFactor(date, weekday) * seasonFactor(p.sim.season, date) * trendFactor(p.sim.trend, t);
      const n = rng.poisson(lambda);
      for (let i = 0; i < n; i++) pool.push(p.id);
    }
    rng.shuffle(pool);
    const activeCustomers = customers.filter((c) => c.joinedOn <= date);

    let cursor = 0;
    while (cursor < pool.length) {
      const size = rng.weighted(BASKET_SIZES, (s) => s.w).n;
      const slice = pool.slice(cursor, cursor + size);
      cursor += size;

      const wanted = new Map<string, number>();
      for (const id of slice) wanted.set(id, (wanted.get(id) ?? 0) + 1);

      const customer = rng.chance(REGISTERED_SHARE) ? rng.weighted(activeCustomers, (c) => c.sim.weight) : null;
      if (customer?.type === "business") {
        for (const [id, q] of wanted) {
          if (BULK_CATEGORIES.has(productById.get(id)!.categoryId)) {
            wanted.set(id, Math.max(q, Math.round(q * customer.sim.basket * rng.range(0.7, 1.6))));
          }
        }
      }

      const items: BillItem[] = [];
      for (const [productId, q] of wanted) {
        const available = stock.get(productId) ?? 0;
        const quantity = Math.min(q, available);
        if (quantity <= 0) continue;
        stock.set(productId, available - quantity);
        items.push({ productId, quantity, unitPrice: priceAt(productId, date), unitCost: Math.round(avgCost.get(productId) ?? 0), discount: 0 });
      }
      if (items.length === 0) continue;

      const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

      // Day-specific coupons
      let couponId: string | undefined;
      let couponDiscount = 0;
      for (const coupon of rng.shuffle(coupons.filter((c) => !c.paused && couponValidOn(c, date)))) {
        if (!segmentAllows(coupon, customer, date)) continue;
        if (coupon.usageLimit && (couponUsage.get(coupon.id) ?? 0) >= coupon.usageLimit) continue;
        const eligible = items
          .filter((i) => coupon.categoryIds.length === 0 || coupon.categoryIds.includes(productById.get(i.productId)!.categoryId))
          .reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
        const discount = couponDiscountFor(coupon, eligible);
        if (discount > 0 && rng.chance(coupon.schedule.kind === "dates" ? 0.75 : 0.5)) {
          couponId = coupon.id;
          couponDiscount = discount;
          couponUsage.set(coupon.id, (couponUsage.get(coupon.id) ?? 0) + 1);
          break;
        }
      }

      // Loyalty redemption
      let pointsRedeemed = 0;
      if (customer && (pointsBalance.get(customer.id) ?? 0) >= 1000 && subtotal - couponDiscount >= 1500 && rng.chance(0.12)) {
        pointsRedeemed = REDEMPTION_POINTS;
      }

      const net = subtotal - couponDiscount - pointsRedeemed;

      let paymentMode: PaymentMode;
      if (customer?.creditDays && rng.chance(customer.sim.creditShare)) paymentMode = "credit";
      else if (rng.chance(net > 6000 ? 0.4 : 0.15)) paymentMode = "card";
      else paymentMode = rng.chance(0.62) ? "upi" : "cash";

      const festive = isWithin(date, "2025-10-05", "2025-10-21") || isWithin(date, "2025-11-15", "2026-02-28");
      const hasGiftable = items.some((i) => productById.get(i.productId)!.giftable);
      const kind = hasGiftable && rng.chance(festive ? 0.35 : 0.12) ? "gift" : "standard";

      const id = `bil-${String(++billSeq).padStart(5, "0")}`;
      bills.push({
        id,
        number: `PS/${fiscalYear(date)}/${String(billSeq).padStart(5, "0")}`,
        date,
        customerId: customer?.id ?? null,
        items,
        couponId,
        couponDiscount,
        pointsRedeemed,
        paymentMode,
        kind,
      });

      if (paymentMode === "card") cardSalesByMonth.set(monthOf(date), (cardSalesByMonth.get(monthOf(date)) ?? 0) + net);

      if (customer) {
        const log = spendLog.get(customer.id) ?? [];
        log.push({ date, amount: net });
        spendLog.set(customer.id, log);

        let balance = pointsBalance.get(customer.id) ?? 0;
        if (pointsRedeemed > 0) {
          balance -= pointsRedeemed;
          loyalty.push({ id: `loy-${String(++loySeq).padStart(5, "0")}`, customerId: customer.id, date, points: -pointsRedeemed, kind: "redeemed", billId: id, note: `Redeemed against ${id}` });
        }
        const earned = Math.floor(net / RUPEES_PER_POINT);
        if (earned > 0) {
          balance += earned;
          loyalty.push({ id: `loy-${String(++loySeq).padStart(5, "0")}`, customerId: customer.id, date, points: earned, kind: "earned", billId: id, note: "Points on purchase" });
        }
        pointsBalance.set(customer.id, balance);

        if (paymentMode === "credit") {
          receivables.push({ id: `rcv-${String(++rcvSeq).padStart(4, "0")}`, customerId: customer.id, billId: id, amount: net, issuedOn: date, dueOn: addDays(date, customer.creditDays ?? 15) });
        }
      }
    }

    // 4. Re-ordering (Mondays & Thursdays)
    if (weekday === 1 || weekday === 4) {
      const linesByVendor = new Map<VendorSeed, PurchaseItem[]>();
      for (const p of products) {
        if (p.sim.stopReorderAfter && date > p.sim.stopReorderAfter) continue;
        let rate = DEMAND_SCALE * p.sim.demand * 1.05 * seasonFactor(p.sim.season, addDays(date, 10)) * trendFactor(p.sim.trend, t + 10);
        if (isWithin(date, PREBUY_WINDOW.from, PREBUY_WINDOW.to) && isDiwaliLinked(p)) rate *= 1.8;
        const position = (stock.get(p.id) ?? 0) + (onOrder.get(p.id) ?? 0);
        if (position > Math.max(p.reorderLevel, rate * 12)) continue;
        const need = Math.max(p.reorderLevel * 2, rate * 40) - position;
        if (need <= 0) continue;

        const vendor = chooseVendor(p, date, need);
        const moq = minOrderQtyFor(p, vendor);
        const quantity = Math.ceil(need / moq) * moq;
        const listUnitCost = book.costAt(p.id, vendor.id, monthOf(date));
        const offer = liveOffer(vendor.id, p.id, date, quantity);
        const lines = linesByVendor.get(vendor) ?? [];
        lines.push({ productId: p.id, quantity, listUnitCost, unitCost: Math.round(effectiveUnitCost(listUnitCost, offer?.benefit)), receivedQuantity: 0, offerId: offer?.id });
        linesByVendor.set(vendor, lines);
      }

      for (const [vendor, items] of linesByVendor) {
        const expectedOn = addDays(date, vendor.leadTimeDays);
        const purchase: Purchase = { id: "", number: "", vendorId: vendor.id, status: "ordered", orderedOn: date, expectedOn, items, receipts: [] };
        purchases.push(purchase);
        const delay = rng.int(-1, Math.ceil((1 - vendor.sim.reliability) * 14));
        const arrival = addDays(date, Math.max(1, vendor.leadTimeDays + delay));
        const partial = rng.chance(0.1);
        for (const item of items) {
          onOrder.set(item.productId, (onOrder.get(item.productId) ?? 0) + item.quantity);
          if (partial && item.quantity >= 4) {
            const first = Math.floor(item.quantity * rng.range(0.6, 0.85));
            schedule(arrival, { purchase, item, quantity: first });
            schedule(addDays(arrival, rng.int(4, 9)), { purchase, item, quantity: item.quantity - first });
          } else {
            schedule(arrival, { purchase, item, quantity: item.quantity });
          }
        }
      }
    }
  }

  // ---- Purchases that never completed / special cases -------------------------
  purchases.push({
    id: "", number: "", vendorId: "ven-western", status: "cancelled", orderedOn: "2026-02-19", expectedOn: "2026-02-27", receipts: [],
    items: [{ productId: "prd-008", quantity: 12, listUnitCost: book.costAt("prd-008", "ven-western", "2026-02"), unitCost: book.costAt("prd-008", "ven-western", "2026-02"), receivedQuantity: 0 }],
    notes: "Cancelled — existing stock still not moving.",
  });
  purchases.push({
    id: "", number: "", vendorId: "ven-vardhman", status: "draft", orderedOn: AS_OF, expectedOn: addDays(AS_OF, 2), receipts: [],
    items: ["prd-045", "prd-047"].map((productId, i) => {
      const list = book.costAt(productId, "ven-vardhman", "2026-09");
      const offer = offers.find((o) => o.id === "off-2026-phi-festive");
      return { productId, quantity: i === 0 ? 20 : 10, listUnitCost: list, unitCost: Math.round(effectiveUnitCost(list, offer?.benefit)), receivedQuantity: 0, offerId: offer?.id };
    }),
    notes: "Draft — Diwali stock-up under Philips festive scheme.",
  });
  purchases.push({
    id: "", number: "", vendorId: "ven-sai", status: "draft", orderedOn: AS_OF, expectedOn: addDays(AS_OF, 5), receipts: [],
    items: ["prd-021", "prd-022"].map((productId, i) => {
      const list = book.costAt(productId, "ven-sai", "2026-09");
      return { productId, quantity: i === 0 ? 10 : 12, listUnitCost: list, unitCost: list, receivedQuantity: 0 };
    }),
    notes: "Draft — consider holding until the La Opala & Larah Diwali offer opens on 3 Oct.",
  });

  purchases.sort((a, b) => a.orderedOn.localeCompare(b.orderedOn));
  const fySeq = new Map<string, number>();
  purchases.forEach((p, i) => {
    const fy = fiscalYear(p.orderedOn);
    const n = (fySeq.get(fy) ?? 0) + 1;
    fySeq.set(fy, n);
    p.id = `pur-${String(i + 1).padStart(4, "0")}`;
    p.number = `PO/${fy}/${String(n).padStart(4, "0")}`;
    if (p.status === "draft" || p.status === "cancelled") return;
    const ordered = p.items.reduce((a, i2) => a + i2.quantity, 0);
    const received = p.items.reduce((a, i2) => a + i2.receivedQuantity, 0);
    const dates = (receiptDates.get(p) ?? []).sort();
    if (received >= ordered) {
      p.status = "received";
      p.receivedOn = dates[dates.length - 1];
    } else if (received > 0) {
      p.status = "partially-received";
      p.receivedOn = dates[0];
    } else {
      p.status = "ordered";
    }
  });

  return { bills, purchases, openingStock, stockAdjustments: adjustments, loyaltyEntries: loyalty, receivables, cardSalesByMonth };
}
