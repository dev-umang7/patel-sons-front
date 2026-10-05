/** Generates price revisions, vendor cost history and current source quotes. */
import { addDays, eachMonth, monthOf, type ISODate, type ISOMonth } from "@/lib/dates";
import type { PriceRevision } from "@/data-access/types/catalog";
import type { CostObservation, SourceQuote } from "@/data-access/types/procurement";
import type { ProductSeed } from "../catalog";
import type { VendorSeed } from "../vendors";
import type { Rng } from "./random";
import { AS_OF, HISTORY_START } from "./seasonality";

/** Brands that took a price increase on 1 April 2026. */
const HIKE_BRANDS = new Set(["brd-prestige", "brd-hawkins", "brd-philips", "brd-bajaj", "brd-havells", "brd-milton"]);
export const PRICE_HIKE_DATE: ISODate = "2026-04-01";
const SELL_HIKE = 1.05;
const COST_HIKE = 1.045;

function roundRetail(x: number): number {
  if (x < 500) return Math.round(x / 10) * 10 - 1;
  return Math.round(x / 50) * 50 - 1;
}

function roundMrp(x: number): number {
  return Math.round(x / 5) * 5;
}

export function buildPriceRevisions(products: ProductSeed[]): PriceRevision[] {
  const out: PriceRevision[] = [];
  let n = 0;
  const id = () => `rev-${String(++n).padStart(4, "0")}`;
  for (const p of products) {
    if (HIKE_BRANDS.has(p.brandId)) {
      out.push({ id: id(), productId: p.id, effectiveFrom: "2025-04-01", sellingPrice: roundRetail(p.sellingPrice / SELL_HIKE), mrp: roundMrp(p.mrp / SELL_HIKE), note: "FY 2025–26 price list" });
      out.push({ id: id(), productId: p.id, effectiveFrom: PRICE_HIKE_DATE, sellingPrice: p.sellingPrice, mrp: p.mrp, note: "Brand price revision (+5%)" });
    } else {
      out.push({ id: id(), productId: p.id, effectiveFrom: p.introducedOn < "2025-04-01" ? "2025-04-01" : p.introducedOn, sellingPrice: p.sellingPrice, mrp: p.mrp, note: "FY 2025–26 price list" });
    }
  }
  return out;
}

export function vendorsCarrying(product: ProductSeed, vendors: VendorSeed[]): VendorSeed[] {
  return vendors.filter((v) => v.brandIds.includes(product.brandId));
}

export interface CostBook {
  observations: CostObservation[];
  costAt(productId: string, vendorId: string, month: ISOMonth): number;
}

export function buildCostBook(rng: Rng, products: ProductSeed[], vendors: VendorSeed[]): CostBook {
  const months = eachMonth(HISTORY_START, AS_OF);
  const table = new Map<string, number>();
  const observations: CostObservation[] = [];

  for (const p of products) {
    for (const v of vendorsCarrying(p, vendors)) {
      const base = p.sellingPrice * p.sim.costRatio * v.sim.priceFactor * rng.range(0.985, 1.015);
      let drift = 1;
      for (const m of months) {
        drift = Math.min(1.03, Math.max(0.97, drift * (1 + rng.range(-0.006, 0.008))));
        const hike = HIKE_BRANDS.has(p.brandId) && `${m}-01` < PRICE_HIKE_DATE ? 1 / COST_HIKE : 1;
        const unitCost = Math.round(base * drift * hike);
        table.set(`${p.id}|${v.id}|${m}`, unitCost);
        observations.push({ productId: p.id, vendorId: v.id, month: m, unitCost });
      }
    }
  }

  return {
    observations,
    costAt(productId, vendorId, month) {
      const clamped = month < months[0] ? months[0] : month > months[months.length - 1] ? months[months.length - 1] : month;
      const value = table.get(`${productId}|${vendorId}|${clamped}`);
      if (value === undefined) throw new Error(`No cost for ${productId} from ${vendorId}`);
      return value;
    },
  };
}

export function minOrderQtyFor(product: ProductSeed, vendor: VendorSeed): number {
  // Wholesalers sell in larger lots; brand-direct and distributors in smaller ones.
  const lot = vendor.type === "wholesaler" ? 2 : 1;
  if (product.sellingPrice < 800) return 12 * lot;
  if (product.sellingPrice < 2500) return 6 * lot;
  return 2 * lot;
}

export function buildQuotes(rng: Rng, products: ProductSeed[], vendors: VendorSeed[], book: CostBook): SourceQuote[] {
  const out: SourceQuote[] = [];
  let n = 0;
  const lastMonth = monthOf(AS_OF);
  for (const p of products) {
    for (const v of vendorsCarrying(p, vendors)) {
      const stale = rng.chance(0.1);
      const quotedOn: ISODate = stale ? `2026-07-${String(rng.int(1, 25)).padStart(2, "0")}` : `2026-09-${String(rng.int(1, 24)).padStart(2, "0")}`;
      out.push({
        id: `quo-${String(++n).padStart(4, "0")}`,
        productId: p.id,
        vendorId: v.id,
        unitCost: Math.round(book.costAt(p.id, v.id, stale ? "2026-07" : lastMonth) * rng.range(0.992, 1.008)),
        minOrderQty: minOrderQtyFor(p, v),
        leadTimeDays: v.leadTimeDays + rng.int(0, 2),
        quotedOn,
        validUntil: addDays(quotedOn, stale ? 30 : 45),
      });
    }
  }
  return out;
}
