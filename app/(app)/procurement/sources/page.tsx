import { ArrowLeftRight, Sparkles, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MovementBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { MultiLineChart } from "@/components/charts/charts";
import { SERIES } from "@/components/charts/palette";
import { KeyValue } from "@/components/data-display/metrics";
import { EmptyState } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { purchaseRepository } from "@/data-access";
import { ProcurementLifecycle } from "@/features/procurement/lifecycle";
import { SourcingTable } from "@/features/procurement/sourcing-table";
import { PriceComparisonTable } from "@/features/procurement/source-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Price comparison" };

export default async function SourcesPage({ searchParams }: PageProps<"/procurement/sources">) {
  const productId = param(await searchParams, "product");
  const [rows, comparison] = await Promise.all([purchaseRepository.listSourcing(), productId ? purchaseRepository.getSourceComparison(productId) : Promise.resolve(null)]);
  const best = comparison?.options.find((o) => o.verdict === "best-value");

  return (
    <Page>
      <PageHeader
        eyebrow="Procurement · source / price comparison"
        title="What to buy, from whom, at what price"
        description="Every source for every product, ranked by effective cost after live vendor offers — with price history and the last price paid."
        meta={<ProcurementLifecycle current="compare" completedThrough="discover" />}
      />

      {comparison ? (
        <section aria-label={`Comparison for ${comparison.name}`} className="mb-10 space-y-4">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-xs md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ProductThumb categoryName={comparison.categoryName} size="lg" />
              <div className="min-w-0">
                <Link href={`/inventory/products/${comparison.productId}`} className="text-lg font-semibold tracking-tight hover:underline">
                  {comparison.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <span>{comparison.brandName}</span>·<span>sells at {formatCurrency(comparison.sellingPrice)}</span>·<span>{comparison.stockOnHand} in stock{comparison.onOrder ? `, ${comparison.onOrder} on order` : ""}</span>
                  <MovementBadge movement={comparison.movement} compact />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="intel">
                <Link href={`/intelligence/pricing?product=${comparison.productId}`}>
                  <Sparkles /> What should we pay?
                </Link>
              </Button>
              {best && (
                <Button asChild variant="primary">
                  <Link href={`/procurement/orders?new=1&product=${comparison.productId}&vendor=${best.vendorId}`}>
                    <Truck /> Order from {best.vendorName.split(" ")[0]}
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link href="/procurement/sources" scroll={false}>
                  Close
                </Link>
              </Button>
            </div>
          </div>
          <PriceComparisonTable options={comparison.options} sellingPrice={comparison.sellingPrice} />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Price history by source" description="Monthly quoted cost — spot who is drifting up" />
              <CardBody>
                <MultiLineChart data={comparison.costHistory} xKey="month" series={comparison.vendorsInHistory.map((v, i) => ({ key: v.id, label: v.name, color: SERIES[i] }))} height={240} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Purchase evaluation" />
              <CardBody>
                <KeyValue
                  items={[
                    { label: "Average stock cost", value: formatCurrency(comparison.avgUnitCost) },
                    { label: "Best effective cost", value: best ? formatCurrency(best.effectiveCost) : "—", hint: best?.vendorName },
                    { label: "Last paid", value: comparison.purchaseHistory[0] ? formatCurrency(comparison.purchaseHistory[0].unitCost) : "—", hint: comparison.purchaseHistory[0] ? `${comparison.purchaseHistory[0].vendorName} · ${formatDate(comparison.purchaseHistory[0].date)}` : undefined },
                    { label: "Stock vs re-order level", value: `${comparison.stockOnHand} / ${comparison.reorderLevel}` },
                  ]}
                />
              </CardBody>
            </Card>
          </div>
        </section>
      ) : (
        <div className="mb-8 rounded-lg border border-dashed border-border-strong bg-surface/50">
          <EmptyState icon={ArrowLeftRight} title="Select a product to compare its sources" description="Pick any row below — or search by name or SKU. Products with the widest price spread between vendors are listed first." />
        </div>
      )}

      <Section title="All products by sourcing position" description="Spread = how much the costliest source charges above the cheapest">
        <SourcingTable rows={rows} />
      </Section>
    </Page>
  );
}
