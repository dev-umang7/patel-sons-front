import { diffDays, type ISODate } from "@/lib/dates";
import { OFFER_RULES } from "../rules/assumptions";
import type { ID } from "../types/common";
import type { OfferBenefit, VendorOffer } from "../types/procurement";

export type OfferStatus = "upcoming" | "active" | "expiring" | "expired";

export function offerStatus(offer: VendorOffer, asOf: ISODate): OfferStatus {
  if (asOf < offer.startsOn) return "upcoming";
  if (asOf > offer.endsOn) return "expired";
  return diffDays(asOf, offer.endsOn) <= OFFER_RULES.expiringSoonDays ? "expiring" : "active";
}

export function isOfferLive(offer: VendorOffer, date: ISODate): boolean {
  return date >= offer.startsOn && date <= offer.endsOn;
}

export function offerCoversProduct(offer: VendorOffer, productId: ID): boolean {
  return offer.productIds.includes(productId);
}

export function meetsOfferQuantity(offer: VendorOffer, quantity: number): boolean {
  if (offer.benefit.kind === "free-units" && quantity < offer.benefit.buy) return false;
  return quantity >= (offer.minQty ?? 0);
}

/**
 * Effective per-unit cost under an offer. CALCULATED.
 * ASSUMPTION: free-unit schemes are expressed as cost spread across paid + free units.
 */
export function effectiveUnitCost(listUnitCost: number, benefit: OfferBenefit | undefined): number {
  if (!benefit) return listUnitCost;
  switch (benefit.kind) {
    case "percent":
      return listUnitCost * (1 - benefit.value / 100);
    case "flat-per-unit":
      return Math.max(0, listUnitCost - benefit.value);
    case "free-units":
      return (listUnitCost * benefit.buy) / (benefit.buy + benefit.free);
  }
}

/** Saving per unit as a % of list cost. */
export function offerSavingPercent(benefit: OfferBenefit, listUnitCost: number): number {
  if (listUnitCost <= 0) return 0;
  return ((listUnitCost - effectiveUnitCost(listUnitCost, benefit)) / listUnitCost) * 100;
}

export function describeOfferBenefit(benefit: OfferBenefit): string {
  switch (benefit.kind) {
    case "percent":
      return `${benefit.value}% off`;
    case "flat-per-unit":
      return `₹${benefit.value} off per unit`;
    case "free-units":
      return `${benefit.free} free per ${benefit.buy}`;
  }
}
