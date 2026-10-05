import type { Metadata } from "next";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Page, PageHeader } from "@/components/layout/page";
import { vendorRepository } from "@/data-access";
import { VendorsTable } from "@/features/procurement/vendors-table";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const vendors = await vendorRepository.listVendors();
  const total = vendors.reduce((a, v) => a + v.purchaseValue, 0);
  const rated = vendors.filter((v) => v.onTimeRate !== null);
  return (
    <Page>
      <PageHeader eyebrow="Procurement" title="Brands & vendors" description="Who supplies what, at what price, and how reliably — on-time delivery and price competitiveness are calculated from purchase history." />
      <MetricStrip columns={4} className="mb-6">
        <Metric label="Active vendors" value={vendors.length} format="number" caption={`${new Set(vendors.flatMap((v) => v.brandNames)).size} brands covered`} />
        <Metric label="Purchased · 12 months" value={total} />
        <Metric label="Average on-time delivery" value={rated.reduce((a, v) => a + (v.onTimeRate ?? 0), 0) / Math.max(1, rated.length)} format="percent" />
        <Metric label="Live vendor offers" value={vendors.reduce((a, v) => a + v.liveOffers, 0)} format="number" href="/procurement/offers" />
      </MetricStrip>
      <VendorsTable vendors={vendors} />
    </Page>
  );
}
