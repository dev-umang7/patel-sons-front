import { addDays, diffDays, eachMonth, isWithin } from "@/lib/dates";
import { billCost, billDiscounts, billNetTotal, billSubtotal, billUnits } from "../../calculations/bills";
import { AGEING_BUCKETS, RECEIVABLE_STATUS_ORDER, type ReceivableStatus } from "../../calculations/collections";
import { COUPON_SEGMENT_LABEL, couponStatus, couponValidOn, couponWindow, describeCouponDiscount } from "../../calculations/coupons";
import type { CollectionsRepository, CrmRepository, CustomerRepository, SalesRepository } from "../../contracts";
import type { ID } from "../../types/common";
import type { Coupon } from "../../types/crm";
import type { Bill } from "../../types/sales";
import type {
  BillSummary,
  CampaignView,
  CollectionsOverview,
  CouponView,
  CustomerDetail,
  CustomerSummary,
  LoyaltyMember,
  LoyaltyOverview,
} from "../../types/views";
import { derived, latency } from "./context";

export function toBillSummary(b: Bill): BillSummary {
  const d = derived();
  const net = billNetTotal(b);
  return {
    id: b.id,
    number: b.number,
    date: b.date,
    customerId: b.customerId,
    customerName: d.customerName(b.customerId),
    lineCount: b.items.length,
    units: billUnits(b),
    subtotal: billSubtotal(b),
    discount: billDiscounts(b),
    net,
    profit: Math.round(net - billCost(b)),
    paymentMode: b.paymentMode,
    kind: b.kind,
    couponCode: b.couponId ? (d.ds.coupons.find((c) => c.id === b.couponId)?.code ?? null) : null,
    categoryNames: [...new Set(b.items.map((i) => d.categoryName(d.productById.get(i.productId)!.categoryId)))],
  };
}

function customerSummary(customerId: ID): CustomerSummary {
  const d = derived();
  const c = d.ds.customers.find((x) => x.id === customerId)!;
  const bills = d.billsAsc.filter((b) => b.customerId === customerId);
  const spend = bills.reduce((a, b) => a + billNetTotal(b), 0);
  const last = bills.at(-1)?.date ?? null;
  const tier = d.tierFor(customerId);
  const owed = d.receivables.filter((r) => r.customerId === customerId);
  return {
    id: c.id,
    name: c.name,
    businessName: c.businessName,
    type: c.type,
    phone: c.phone,
    email: c.email,
    area: c.area,
    joinedOn: c.joinedOn,
    bills: bills.length,
    spend,
    spend12m: d.spend12m.get(customerId) ?? 0,
    avgBill: bills.length ? spend / bills.length : 0,
    lastPurchaseOn: last,
    daysSinceLastPurchase: last ? diffDays(last, d.asOf) : null,
    tierId: tier.id,
    tierName: tier.name,
    pointsBalance: d.pointsBalance.get(customerId) ?? 0,
    outstanding: owed.reduce((a, r) => a + r.outstanding, 0),
    overdue: owed.filter((r) => r.status === "overdue" || r.status === "critical").reduce((a, r) => a + r.outstanding, 0),
    creditDays: c.creditDays,
  };
}

let customerCache: CustomerSummary[] | null = null;
export function allCustomerSummaries(): CustomerSummary[] {
  customerCache ??= derived().ds.customers.map((c) => customerSummary(c.id));
  return customerCache;
}

export const dummySalesRepository: SalesRepository = {
  async listBills(range) {
    await latency();
    return derived()
      .billsAsc.filter((b) => isWithin(b.date, range.from, range.to))
      .map(toBillSummary)
      .reverse();
  },
  async getBill(id) {
    await latency();
    const d = derived();
    const b = d.billById.get(id);
    if (!b) return null;
    return {
      ...toBillSummary(b),
      items: b.items.map((i) => {
        const item = d.inventoryById.get(i.productId)!;
        return { productId: i.productId, name: item.name, sku: item.sku, categoryName: item.categoryName, quantity: i.quantity, unitPrice: i.unitPrice, unitCost: i.unitCost, discount: i.discount, lineTotal: i.quantity * i.unitPrice - i.discount, movementNow: item.movement };
      }),
      couponDiscount: b.couponDiscount,
      pointsRedeemed: b.pointsRedeemed,
      pointsEarned: d.ds.loyaltyEntries.filter((e) => e.billId === id && e.kind === "earned").reduce((a, e) => a + e.points, 0),
      receivable: d.receivables.find((r) => r.billId === id) ?? null,
      customer: b.customerId ? (d.ds.customers.find((c) => c.id === b.customerId) ?? null) : null,
    };
  },
};

export const dummyCustomerRepository: CustomerRepository = {
  async listCustomers() {
    await latency();
    return allCustomerSummaries();
  },
  async getCustomer(id) {
    await latency();
    const d = derived();
    const customer = d.ds.customers.find((c) => c.id === id);
    if (!customer) return null;
    const summary = allCustomerSummaries().find((c) => c.id === id)!;
    const bills = d.billsAsc.filter((b) => b.customerId === id);
    const lines = d.saleLines.filter((l) => l.customerId === id);

    const catMap = new Map<ID, number>();
    const prodMap = new Map<ID, { units: number; spend: number }>();
    for (const l of lines) {
      catMap.set(l.categoryId, (catMap.get(l.categoryId) ?? 0) + l.revenue);
      const p = prodMap.get(l.productId) ?? { units: 0, spend: 0 };
      p.units += l.quantity;
      p.spend += l.revenue;
      prodMap.set(l.productId, p);
    }
    const loyalty = d.ds.loyaltyEntries.filter((e) => e.customerId === id).sort((a, b) => b.date.localeCompare(a.date));

    const detail: CustomerDetail = {
      ...summary,
      customer,
      recentBills: bills.slice(-40).reverse().map(toBillSummary),
      monthly: eachMonth(d.ds.meta.historyStart, d.asOf).map((month) => {
        const m = bills.filter((b) => b.date.startsWith(month));
        return { month, spend: Math.round(m.reduce((a, b) => a + billNetTotal(b), 0)), bills: m.length };
      }),
      topCategories: [...catMap].map(([categoryId, spend]) => ({ categoryId, name: d.categoryName(categoryId), spend: Math.round(spend) })).sort((a, b) => b.spend - a.spend),
      topProducts: [...prodMap]
        .map(([productId, v]) => ({ productId, name: d.inventoryById.get(productId)!.name, units: v.units, spend: Math.round(v.spend) }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 8),
      loyalty: loyalty.slice(0, 50),
      pointsEarned: loyalty.filter((e) => e.points > 0).reduce((a, e) => a + e.points, 0),
      pointsRedeemed: -loyalty.filter((e) => e.points < 0).reduce((a, e) => a + e.points, 0),
      coupons: bills
        .filter((b) => b.couponId)
        .map((b) => {
          const c = d.ds.coupons.find((x) => x.id === b.couponId)!;
          return { couponId: c.id, code: c.code, title: c.title, date: b.date, billId: b.id, discount: b.couponDiscount };
        })
        .reverse(),
      receivables: d.receivables.filter((r) => r.customerId === id).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn)),
      nextTier: d.nextTierFor(id),
    };
    return detail;
  },
  async listCustomerOptions() {
    return derived()
      .ds.customers.map((c) => ({ id: c.id, name: c.businessName ? `${c.businessName} (${c.name})` : c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
};

export function collectionsOverview(): CollectionsOverview {
  const d = derived();
  const open = d.receivables.filter((r) => r.outstanding > 0);
  const sumBy = (pred: (s: ReceivableStatus) => boolean) => open.filter((r) => pred(r.status)).reduce((a, r) => a + r.outstanding, 0);
  const byCustomer = new Map<ID, CollectionsOverview["byCustomer"][number]>();
  for (const r of open) {
    const acc = byCustomer.get(r.customerId) ?? { customerId: r.customerId, name: r.customerName, outstanding: 0, overdue: 0, oldestDueOn: r.dueOn, worstStatus: r.status, receivables: 0 };
    acc.outstanding += r.outstanding;
    if (r.status === "overdue" || r.status === "critical") acc.overdue += r.outstanding;
    if (r.dueOn < acc.oldestDueOn) acc.oldestDueOn = r.dueOn;
    if (RECEIVABLE_STATUS_ORDER[r.status] < RECEIVABLE_STATUS_ORDER[acc.worstStatus]) acc.worstStatus = r.status;
    acc.receivables++;
    byCustomer.set(r.customerId, acc);
  }
  const from30 = addDays(d.asOf, -29);
  return {
    totalOutstanding: open.reduce((a, r) => a + r.outstanding, 0),
    overdueAmount: sumBy((s) => s === "overdue" || s === "critical"),
    criticalAmount: sumBy((s) => s === "critical"),
    dueSoonAmount: sumBy((s) => s === "due-soon"),
    customersOwing: byCustomer.size,
    collectedLast30: d.ds.collectionPayments.filter((p) => p.date >= from30).reduce((a, p) => a + p.amount, 0),
    byStatus: (["critical", "overdue", "due-soon", "current"] as const).map((status) => {
      const m = open.filter((r) => r.status === status);
      return { status, amount: m.reduce((a, r) => a + r.outstanding, 0), count: m.length };
    }),
    byBucket: AGEING_BUCKETS.map((bucket) => {
      const m = open.filter((r) => r.bucket === bucket);
      return { bucket, amount: m.reduce((a, r) => a + r.outstanding, 0), count: m.length };
    }),
    byCustomer: [...byCustomer.values()].sort((a, b) => b.outstanding - a.outstanding),
  };
}

export const dummyCollectionsRepository: CollectionsRepository = {
  async listReceivables(options) {
    await latency();
    const list = derived().receivables.filter((r) => options?.includePaid || r.outstanding > 0);
    return [...list].sort((a, b) => RECEIVABLE_STATUS_ORDER[a.status] - RECEIVABLE_STATUS_ORDER[b.status] || b.daysOverdue - a.daysOverdue || a.dueOn.localeCompare(b.dueOn));
  },
  async getOverview() {
    await latency();
    return collectionsOverview();
  },
};

function couponView(c: Coupon): CouponView {
  const d = derived();
  const bills = d.billsAsc.filter((b) => b.couponId === c.id);
  const window = couponWindow(c);
  let nextDate: string | null = null;
  for (let day = d.asOf; day <= window.to; day = addDays(day, 1)) {
    if (couponValidOn(c, day)) {
      nextDate = day;
      break;
    }
  }
  return {
    ...c,
    status: couponStatus(c, d.asOf),
    windowFrom: window.from,
    windowTo: window.to,
    uses: bills.length,
    discountGiven: bills.reduce((a, b) => a + b.couponDiscount, 0),
    billRevenue: Math.round(bills.reduce((a, b) => a + billNetTotal(b), 0)),
    campaignName: c.campaignId ? (d.ds.campaigns.find((x) => x.id === c.campaignId)?.name ?? null) : null,
    categoryNames: c.categoryIds.map(d.categoryName),
    discountLabel: describeCouponDiscount(c),
    segmentLabel: COUPON_SEGMENT_LABEL[c.segment],
    nextDate,
  };
}

export const dummyCrmRepository: CrmRepository = {
  async getLoyalty() {
    await latency();
    const d = derived();
    const members: LoyaltyMember[] = d.ds.customers.map((c) => {
      const entries = d.ds.loyaltyEntries.filter((e) => e.customerId === c.id);
      const tier = d.tierFor(c.id);
      const next = d.nextTierFor(c.id);
      return {
        customerId: c.id,
        name: c.businessName ?? c.name,
        type: c.type,
        tierId: tier.id,
        tierName: tier.name,
        spend12m: Math.round(d.spend12m.get(c.id) ?? 0),
        pointsEarned: entries.filter((e) => e.points > 0).reduce((a, e) => a + e.points, 0),
        pointsRedeemed: -entries.filter((e) => e.points < 0).reduce((a, e) => a + e.points, 0),
        pointsBalance: d.pointsBalance.get(c.id) ?? 0,
        lastActivityOn: entries.map((e) => e.date).sort().at(-1) ?? null,
        nextTierName: next?.name ?? null,
        toNextTier: next?.remaining ?? null,
      };
    });
    const nameOf = new Map(d.ds.customers.map((c) => [c.id, c.businessName ?? c.name]));
    const overview: LoyaltyOverview = {
      tiers: d.ds.loyaltyTiers.map((t) => {
        const m = members.filter((x) => x.tierId === t.id);
        return { ...t, members: m.length, spend: m.reduce((a, x) => a + x.spend12m, 0) };
      }),
      members: members.sort((a, b) => b.spend12m - a.spend12m),
      pointsOutstanding: members.reduce((a, m) => a + m.pointsBalance, 0),
      pointsEarned: members.reduce((a, m) => a + m.pointsEarned, 0),
      pointsRedeemed: members.reduce((a, m) => a + m.pointsRedeemed, 0),
      recent: [...d.ds.loyaltyEntries]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30)
        .map((e) => ({ ...e, customerName: nameOf.get(e.customerId)! })),
    };
    return overview;
  },
  async listCoupons() {
    await latency();
    return derived().ds.coupons.map(couponView);
  },
  async listCampaigns() {
    await latency();
    const d = derived();
    return d.ds.campaigns.map((c): CampaignView => {
      const coupons = d.ds.coupons.filter((x) => x.campaignId === c.id).map(couponView);
      const status = d.asOf < c.startsOn ? "planned" : d.asOf > c.endsOn ? "completed" : "running";
      return {
        ...c,
        status,
        coupons,
        uses: coupons.reduce((a, x) => a + x.uses, 0),
        revenue: coupons.reduce((a, x) => a + x.billRevenue, 0),
        discountGiven: coupons.reduce((a, x) => a + x.discountGiven, 0),
      };
    });
  },
};
