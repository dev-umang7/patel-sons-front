import { ArrowRight, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DecisionBadge, MovementBadge } from "@/components/business/badges";
import { InventoryHealthIndicator } from "@/components/business/movement";
import { ProductThumb } from "@/components/business/product-thumb";
import { ProvenanceTag } from "@/components/business/provenance";
import { BarList } from "@/components/charts/bar-list";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { EmptyState } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { inventoryRepository, metaRepository } from "@/data-access";
import { diffDays } from "@/lib/dates";
import { formatCurrencyCompact, formatDateShort, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Inventory" };

const ARRIVAL_WINDOW_DAYS = 14;

export default async function InventoryOverviewPage() {
  const [overview, decisions, meta] = await Promise.all([inventoryRepository.getOverview(), inventoryRepository.listDecisions(), metaRepository.getMeta()]);
  const arrivals = decisions
    .filter((i) => i.lastPurchaseOn && diffDays(i.lastPurchaseOn, meta.asOf) <= ARRIVAL_WINDOW_DAYS)
    .sort((a, b) => (b.lastPurchaseOn ?? "").localeCompare(a.lastPurchaseOn ?? ""));
  const nonMoving = overview.movement.filter((m) => m.movement === "slow" || m.movement === "dead");

  return (
    <Page>
      <PageHeader
        eyebrow="Inventory"
        title="What do we have?"
        description="Stock value, how it is moving and how long it has been sitting — the starting point for keep, replace and eliminate decisions."
        actions={
          <>
            <Button asChild>
              <Link href="/inventory/movement">Stock movement</Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/inventory/products">All products</Link>
            </Button>
          </>
        }
      />
      <div className="space-y-8">
        <MetricStrip columns={5}>
          <Metric label="Stock value" value={overview.stockValue} caption="at average cost" emphasis />
          <Metric label="Retail value" value={overview.retailValue} caption="at selling price" />
          <Metric label="Units in stock" value={overview.stockUnits} format="number" caption={`${overview.totalProducts} products`} />
          <Metric label="Low or out of stock" value={overview.lowStockCount} format="number" caption={`${formatNumber(overview.onOrderUnits)} units on order`} href="/inventory/products?view=low-stock" />
          <Metric label="Tied up in non-fast items" value={nonMoving.reduce((a, m) => a + m.stockValue, 0)} caption={`${nonMoving.reduce((a, m) => a + m.products, 0)} products`} href="/inventory/slow-moving" />
        </MetricStrip>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Movement" description="Stock value by movement class" actions={<ProvenanceTag kind="calculated" />} />
            <CardBody>
              <InventoryHealthIndicator breakdown={overview.movement} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="By category" description="Stock value · of which slow or dead" />
            <CardBody>
              <BarList
                items={[...overview.byCategory]
                  .sort((a, b) => b.stockValue - a.stockValue)
                  .map((c) => ({ key: c.categoryId, label: c.categoryName, value: c.stockValue, display: formatCurrencyCompact(c.stockValue), secondary: c.slowValue > 0 ? `${formatCurrencyCompact(c.slowValue)} slow` : undefined, href: `/inventory/categories/${c.categoryId}` }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Stock ageing" description="Average days stock has been held (first in, first out)" />
            <CardBody>
              <BarList color="var(--chart-1)" items={overview.ageing.map((a) => ({ key: a.bucket, label: `${a.bucket} days`, value: a.stockValue, display: formatCurrencyCompact(a.stockValue), secondary: `${formatNumber(a.units)} units` }))} />
            </CardBody>
          </Card>
        </div>

        <Section
          title="Decide on arrival"
          description={`Products received in the last ${ARRIVAL_WINDOW_DAYS} days, with how they are moving and the suggested decision`}
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/inventory/decisions">
                All decisions <ArrowRight />
              </Link>
            </Button>
          }
        >
          <Card>
            {arrivals.length === 0 ? (
              <EmptyState icon={PackageCheck} title="No recent arrivals" description={`Nothing has been received in the last ${ARRIVAL_WINDOW_DAYS} days. Open purchase orders are listed under Procurement.`} />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {arrivals.slice(0, 10).map((i) => (
                  <li key={i.productId}>
                    <Link href={`/inventory/products/${i.productId}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-hover sm:flex-nowrap">
                      <ProductThumb categoryName={i.categoryName} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{i.name}</span>
                        <span className="text-xs text-fg-muted">
                          Received {formatDateShort(i.lastPurchaseOn!)} from {i.lastVendorName} · {i.stockOnHand} in stock · {i.unitsSold30} sold in 30 days
                        </span>
                      </span>
                      <MovementBadge movement={i.movement} compact />
                      <span className="flex min-w-48 items-center justify-end gap-2">
                        <span className="hidden truncate text-xs text-fg-muted md:inline">{i.recommendation.headline}</span>
                        <DecisionBadge decision={i.recommendation.decision} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>
      </div>
    </Page>
  );
}
