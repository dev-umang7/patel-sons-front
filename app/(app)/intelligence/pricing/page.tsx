import { ArrowDownRight, ArrowUpRight, FlaskConical, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfidenceIndicator, MovementBadge } from "@/components/business/badges";
import { PriceRecommendationPanel } from "@/components/business/price-recommendation";
import { ProvenanceTag } from "@/components/business/provenance";
import { EmptyState, Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pricingRepository } from "@/data-access";
import { ProductPicker, TargetMarginControl } from "@/features/intelligence/pricing-controls";
import { PriceComparisonTable } from "@/features/procurement/source-table";
import { formatCurrency, formatPercent, formatSignedPercent } from "@/lib/format";
import { param } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Price composition" };

export default async function PricingPage({ searchParams }: PageProps<"/intelligence/pricing">) {
  const sp = await searchParams;
  const productId = param(sp, "product");
  const marginParam = param(sp, "margin");
  const margin = marginParam && /^\d{2}$/.test(marginParam) ? Number(marginParam) : undefined;
  const [candidates, opportunities, result] = await Promise.all([
    pricingRepository.listCandidates(),
    pricingRepository.listOpportunities(5),
    productId ? pricingRepository.getRecommendation(productId, margin) : Promise.resolve(null),
  ]);

  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence · AI Price Composition Tool"
        title="What should we pay — and sell for?"
        description="Composes a purchase and a selling price from cost, vendor quotes, movement, category margin and today's price. Every factor is shown."
        meta={<ProvenanceTag kind="simulated" label="Simulated — rule-based, not a trained model" />}
      />
      <div className="space-y-8">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs md:flex-row md:items-center md:justify-between">
          <ProductPicker options={candidates.map((c) => ({ id: c.productId, name: c.name, sku: c.sku, categoryName: c.categoryName }))} selectedId={productId} />
          {result && <TargetMarginControl value={marginParam} />}
        </div>

        {result ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/inventory/products/${result.item.productId}`} className="font-semibold hover:underline">
                  {result.item.name}
                </Link>
                <MovementBadge movement={result.item.movement} />
                <span className="text-xs text-fg-muted">
                  {result.item.stockOnHand} in stock · {result.item.unitsSold90} sold in 90 days · {result.item.categoryName}
                </span>
              </div>
              <Button asChild size="sm">
                <Link href={`/procurement/sources?product=${result.item.productId}`}>Compare sources</Link>
              </Button>
            </div>
            <PriceRecommendationPanel rec={result.recommendation} />
            <Section title="Vendor prices behind the purchase recommendation">
              <PriceComparisonTable options={result.comparison.options} sellingPrice={result.item.sellingPrice} />
            </Section>
          </>
        ) : (
          <Card>
            <EmptyState icon={Sparkles} title="Pick a product to compose its price" description="Or start from the pricing opportunities below — products whose simulated price differs from today's by 5% or more." />
          </Card>
        )}

        <Notice tone="intel" icon={FlaskConical} title="How this is produced">
          The Price Composition Tool here is a transparent, rule-based simulation running on demo data. It is not a machine-learning model and makes no market predictions. The real pricing formula is an open question for management; the factors and weights are designed to be replaced.
        </Notice>

        <Section title="Pricing opportunities" description={`${opportunities.length} products where the simulated price differs from today's by 5% or more`}>
          <Card>
            <ul className="divide-y divide-border-subtle">
              {opportunities.slice(0, 12).map((o) => {
                const up = o.changePercent > 0;
                return (
                  <li key={o.productId}>
                    <Link href={`/intelligence/pricing?product=${o.productId}`} scroll={false} className={cn("grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 hover:bg-surface-hover md:grid-cols-[1.6fr_1fr_1fr_0.8fr_auto]", o.productId === productId && "bg-surface-selected")}>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{o.name}</span>
                        <span className="text-xs text-fg-muted">{o.categoryName}</span>
                      </span>
                      <span className="hidden md:block">
                        <MovementBadge movement={o.movement} compact />
                      </span>
                      <span className="num hidden text-sm md:block">
                        {formatCurrency(o.current)} → <span className="font-semibold">{formatCurrency(o.recommended)}</span>
                      </span>
                      <span className="hidden md:block">
                        <ConfidenceIndicator confidence={o.confidence} />
                      </span>
                      <span className={cn("num inline-flex items-center justify-end gap-0.5 text-sm font-medium", up ? "text-success" : "text-danger")}>
                        {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {formatSignedPercent(o.changePercent)}
                        <span className="ml-2 hidden text-xs font-normal text-fg-muted lg:inline">margin {formatPercent(o.expectedMarginPercent, 0)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Section>
      </div>
    </Page>
  );
}
