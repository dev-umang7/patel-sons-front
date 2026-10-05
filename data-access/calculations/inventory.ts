/**
 * CALCULATED inventory state, replayed from recorded events:
 * opening stock → goods receipts → adjustments → sales (same-day order).
 * Valuation uses moving weighted-average cost (ASSUMPTION — costing method to be
 * confirmed); ageing uses FIFO layers.
 */
import { diffDays, type ISODate } from "@/lib/dates";
import type { EntityRef, ID } from "../types/common";
import type { OpeningStock, StockAdjustment, StockMovementEntry } from "../types/inventory";
import type { Purchase } from "../types/procurement";
import type { Bill } from "../types/sales";

interface Layer {
  receivedOn: ISODate;
  quantity: number;
}

export interface ProductStockState {
  productId: ID;
  stockOnHand: number;
  avgUnitCost: number;
  onOrder: number;
  lastReceiptOn?: ISODate;
  lastReceiptCost?: number;
  lastVendorId?: ID;
  lastSaleOn?: ISODate;
  oldestLayerOn?: ISODate;
  /** Quantity-weighted age of remaining stock, in days. */
  avgAgeDays: number | null;
  ledger: StockMovementEntry[];
}

interface Event {
  date: ISODate;
  order: number;
  productId: ID;
  quantity: number;
  unitCost?: number;
  type: StockMovementEntry["type"];
  reference: EntityRef;
  vendorId?: ID;
}

const ORDER = { opening: 0, purchase: 1, adjustment: 2, sale: 3 } as const;

export function buildStockStates(input: {
  openingStock: OpeningStock[];
  purchases: Purchase[];
  bills: Bill[];
  adjustments: StockAdjustment[];
  asOf: ISODate;
}): Map<ID, ProductStockState> {
  const events: Event[] = [];

  for (const o of input.openingStock) {
    events.push({ date: o.asOf, order: ORDER.opening, productId: o.productId, quantity: o.quantity, unitCost: o.unitCost, type: "opening", reference: { kind: "product", id: o.productId, label: "Opening stock" } });
  }
  for (const p of input.purchases) {
    const costByProduct = new Map(p.items.map((i) => [i.productId, i.unitCost]));
    for (const r of p.receipts) {
      events.push({ date: r.date, order: ORDER.purchase, productId: r.productId, quantity: r.quantity, unitCost: costByProduct.get(r.productId), type: "purchase", reference: { kind: "purchase", id: p.id, label: p.number }, vendorId: p.vendorId });
    }
  }
  for (const a of input.adjustments) {
    events.push({ date: a.date, order: ORDER.adjustment, productId: a.productId, quantity: a.quantity, type: "adjustment", reference: { kind: "adjustment", id: a.id, label: a.note } });
  }
  for (const b of input.bills) {
    for (const item of b.items) {
      events.push({ date: b.date, order: ORDER.sale, productId: item.productId, quantity: -item.quantity, type: "sale", reference: { kind: "bill", id: b.id, label: b.number } });
    }
  }
  events.sort((a, b) => (a.date === b.date ? a.order - b.order : a.date.localeCompare(b.date)));

  const states = new Map<ID, ProductStockState & { layers: Layer[] }>();
  const stateFor = (productId: ID) => {
    let s = states.get(productId);
    if (!s) {
      s = { productId, stockOnHand: 0, avgUnitCost: 0, onOrder: 0, avgAgeDays: null, ledger: [], layers: [] };
      states.set(productId, s);
    }
    return s;
  };

  let seq = 0;
  for (const e of events) {
    const s = stateFor(e.productId);
    if (e.quantity > 0) {
      if (e.unitCost !== undefined) {
        s.avgUnitCost = s.stockOnHand + e.quantity > 0 ? (s.stockOnHand * s.avgUnitCost + e.quantity * e.unitCost) / (s.stockOnHand + e.quantity) : e.unitCost;
      }
      s.layers.push({ receivedOn: e.date, quantity: e.quantity });
      if (e.type === "purchase") {
        s.lastReceiptOn = e.date;
        s.lastReceiptCost = e.unitCost;
        s.lastVendorId = e.vendorId;
      }
    } else {
      let remaining = -e.quantity;
      while (remaining > 0 && s.layers.length > 0) {
        const layer = s.layers[0];
        const take = Math.min(layer.quantity, remaining);
        layer.quantity -= take;
        remaining -= take;
        if (layer.quantity === 0) s.layers.shift();
      }
      if (e.type === "sale") s.lastSaleOn = e.date;
    }
    s.stockOnHand += e.quantity;
    s.ledger.push({ id: `mov-${++seq}`, date: e.date, productId: e.productId, type: e.type, quantity: e.quantity, balanceAfter: s.stockOnHand, reference: e.reference });
  }

  for (const p of input.purchases) {
    if (p.status !== "ordered" && p.status !== "partially-received") continue;
    for (const item of p.items) stateFor(item.productId).onOrder += item.quantity - item.receivedQuantity;
  }

  const out = new Map<ID, ProductStockState>();
  for (const [id, s] of states) {
    const qty = s.layers.reduce((acc, l) => acc + l.quantity, 0);
    const avgAgeDays = qty > 0 ? Math.round(s.layers.reduce((acc, l) => acc + l.quantity * diffDays(l.receivedOn, input.asOf), 0) / qty) : null;
    const { layers, ...rest } = s;
    out.set(id, { ...rest, oldestLayerOn: layers[0]?.receivedOn, avgAgeDays });
  }
  return out;
}
