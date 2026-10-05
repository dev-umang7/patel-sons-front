import { ArrowLeftRight, Sparkles, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MovementBadge, ProductStatusBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Page } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { metaRepository, productRepository } from "@/data-access";
import { ProductMovementNotice, ProductTabs } from "@/features/inventory/product-detail";
import { formatPercent } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/inventory/products/[id]">): Promise<Metadata> {
  const detail = await productRepository.getProduct((await params).id);
  return { title: detail?.product.name ?? "Product not found" };
}

export default async function ProductPage({ params }: PageProps<"/inventory/products/[id]">) {
  const { id } = await params;
  const [detail, meta] = await Promise.all([productRepository.getProduct(id), metaRepository.getMeta()]);
  if (!detail) notFound();
  const { item, product } = detail;

  return (
    <Page>
      <Link href="/inventory/products" className="mb-4 inline-flex text-xs text-fg-muted hover:text-fg">
        ← All products
      </Link>
      <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <ProductThumb categoryName={item.categoryName} size="xl" className="hidden sm:grid" />
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <Link href={`/inventory/categories/${item.categoryId}`} className="text-fg-muted hover:text-fg hover:underline">
                {item.categoryName}
              </Link>
              <span className="text-fg-subtle">/</span>
              <Link href={`/inventory/brands?brand=${item.brandId}`} className="text-fg-muted hover:text-fg hover:underline">
                {item.brandName}
              </Link>
            </div>
            <h1 className="font-display text-[28px] leading-[1.15] font-[560] text-fg sm:text-[32px]">{product.name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-fg-muted">{product.sku}</span>
              <ProductStatusBadge status={product.status} />
              <MovementBadge movement={item.movement} />
              {item.lowStock && <Badge tone="danger">Low stock</Badge>}
              {item.lowMargin && <Badge tone="warning">Low margin</Badge>}
              {product.giftable && <Badge tone="brass">Giftable</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/procurement/sources?product=${id}`}>
              <ArrowLeftRight /> Compare sources
            </Link>
          </Button>
          <Button asChild variant="intel">
            <Link href={`/intelligence/pricing?product=${id}`}>
              <Sparkles /> Price composition
            </Link>
          </Button>
          <Button asChild variant="primary">
            <Link href={`/procurement/orders?new=1&product=${id}`}>
              <Truck /> Re-order
            </Link>
          </Button>
        </div>
      </header>

      <div className="space-y-5">
        <ProductMovementNotice detail={detail} />
        <MetricStrip columns={6}>
          <Metric label="In stock" value={item.stockOnHand} format="number" caption={item.onOrder > 0 ? `+${item.onOrder} on order` : `re-order at ${item.reorderLevel}`} />
          <Metric label="Stock value" value={item.stockValue} caption="at average cost" />
          <Metric label="Selling price" value={item.sellingPrice} format="currency" caption={`MRP ₹${item.mrp.toLocaleString("en-IN")}`} />
          <Metric label="Average cost" value={item.avgUnitCost} format="currency" caption={`${formatPercent(item.marginPercent)} margin`} />
          <Metric label="Sold · 12 months" value={detail.unitsSold12m} format="number" caption={`${item.unitsSold90} in the last 90 days`} />
          <Metric label="Gross profit · 12 months" value={detail.grossProfit12m} />
        </MetricStrip>
        <ProductTabs detail={detail} asOf={meta.asOf} />
      </div>
    </Page>
  );
}
