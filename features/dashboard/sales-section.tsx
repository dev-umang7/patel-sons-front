import Link from "next/link";
import { BarList } from "@/components/charts/bar-list";
import { TrendChart } from "@/components/charts/charts";
import { MovementBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Delta } from "@/components/data-display/metrics";
import type { CategoryPerformance, PeriodTotals, ProductPerformance, TrendPoint } from "@/data-access/types";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/format";
import type { Granularity } from "@/lib/period";

export function SalesTrendCard({ trend, totals, previous, granularity, className }: { trend: TrendPoint[]; totals: PeriodTotals; previous: PeriodTotals; granularity: Granularity; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader
        title="Sales trend"
        description={`${formatNumber(totals.bills)} bills · ${formatNumber(totals.units)} units · average bill ${formatCurrency(Math.round(totals.avgBill))}`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/reports/sales">Sales report</Link>
          </Button>
        }
      />
      <CardBody>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[28px] leading-none font-semibold tracking-tight">{formatCurrencyCompact(totals.revenue)}</span>
          <Delta current={totals.revenue} previous={previous.revenue} suffix="vs previous period" />
        </div>
        <TrendChart data={trend.map((t) => ({ bucket: t.bucket, value: t.revenue, previous: t.previousRevenue }))} granularity={granularity} label="Sales" height={330} />
      </CardBody>
    </Card>
  );
}

export function TopCategoriesCard({ categories, className }: { categories: CategoryPerformance[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="Category performance" description="Share of sales · gross margin" actions={<Button asChild variant="ghost" size="sm"><Link href="/reports/categories">Category-wise</Link></Button>} />
      <CardBody>
        <BarList
          items={categories.slice(0, 6).map((c) => ({
            key: c.categoryId,
            label: c.name,
            value: c.revenue,
            display: formatCurrencyCompact(c.revenue),
            secondary: `${formatPercent(c.marginPercent, 0)} GM`,
            href: `/inventory/categories/${c.categoryId}`,
          }))}
        />
      </CardBody>
    </Card>
  );
}

export function TopProductsCard({ products, className }: { products: ProductPerformance[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="What is selling" description="Top products by sales in the period" />
      <ul className="divide-y divide-border-subtle border-t border-border-subtle">
        {products.map((p, i) => (
          <li key={p.productId}>
            <Link href={`/inventory/products/${p.productId}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-hover">
              <span className="num w-4 text-xs text-fg-subtle">{i + 1}</span>
              <ProductThumb categoryName={p.categoryName} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">{p.name}</span>
                <span className="text-xs text-fg-muted">
                  {formatNumber(p.units)} units · {formatPercent(p.marginPercent, 0)} margin
                </span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="num text-sm font-medium">{formatCurrencyCompact(p.revenue)}</span>
                <MovementBadge movement={p.movement} compact />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
