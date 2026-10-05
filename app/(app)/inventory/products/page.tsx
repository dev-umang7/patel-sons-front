import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/layout/page";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { inventoryRepository } from "@/data-access";
import { InventoryTable } from "@/features/inventory/inventory-table";
import { param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/inventory/products">) {
  const [items, overview] = await Promise.all([inventoryRepository.listInventory(), inventoryRepository.getOverview()]);
  const nonMoving = overview.movement.filter((m) => m.movement === "slow" || m.movement === "dead");
  return (
    <Page>
      <PageHeader eyebrow="Inventory" title="Products" description="Every product with its stock, value, margin and movement. Select rows to act on several at once." />
      <MetricStrip columns={4} className="mb-6">
        <Metric label="Products" value={overview.totalProducts} format="number" caption={`${overview.stockUnits.toLocaleString("en-IN")} units in stock`} />
        <Metric label="Stock value" value={overview.stockValue} caption="at average cost" />
        <Metric label="Low or out of stock" value={overview.lowStockCount} format="number" caption={`${overview.outOfStockCount} out of stock`} href="/inventory/products?view=low-stock" />
        <Metric label="Slow or not moving" value={nonMoving.reduce((a, m) => a + m.products, 0)} format="number" caption={`${nonMoving.reduce((a, m) => a + m.stockValue, 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} tied up`} href="/inventory/slow-moving" />
      </MetricStrip>
      <InventoryTable items={items} view={param(await searchParams, "view")} />
    </Page>
  );
}
