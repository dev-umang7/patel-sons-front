import Link from "next/link";
import { BarList } from "@/components/charts/bar-list";
import { MovementBadge } from "@/components/business/badges";
import { InventoryHealthIndicator } from "@/components/business/movement";
import { ProductThumb } from "@/components/business/product-thumb";
import { ProvenanceTag } from "@/components/business/provenance";
import { EmptyState } from "@/components/feedback/states";
import { TabbedPanel } from "@/components/data-display/tabbed-panel";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { InventoryItem, InventoryOverview } from "@/data-access/types";
import { formatCurrencyCompact, formatNumber, formatRelativeDays } from "@/lib/format";

function ItemRow({ item, metric }: { item: InventoryItem; metric: "velocity" | "tied" | "stock" }) {
  return (
    <li>
      <Link href={`/inventory/products/${item.productId}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-hover">
        <ProductThumb categoryName={item.categoryName} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-fg">{item.name}</span>
          <span className="text-xs text-fg-muted">
            {metric === "velocity" && `${formatNumber(item.unitsSold90)} sold in 90 days · ${item.stockOnHand} in stock`}
            {metric === "tied" && `Last sold ${item.daysSinceLastSale === null ? "— no sale this year" : formatRelativeDays(item.daysSinceLastSale)} · ${item.stockOnHand} units`}
            {metric === "stock" && `${item.stockOnHand} left · re-order at ${item.reorderLevel}${item.onOrder > 0 ? ` · ${item.onOrder} on order` : ""}`}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1">
          {metric === "tied" ? <span className="num text-sm font-medium">{formatCurrencyCompact(item.stockValue)}</span> : <MovementBadge movement={item.movement} compact />}
          {metric === "tied" && <MovementBadge movement={item.movement} compact />}
        </span>
      </Link>
    </li>
  );
}

export function InventorySection({ overview, fast, slow, low }: { overview: InventoryOverview; fast: InventoryItem[]; slow: InventoryItem[]; low: InventoryItem[] }) {
  const list = (items: InventoryItem[], metric: "velocity" | "tied" | "stock", empty: string) =>
    items.length === 0 ? (
      <EmptyState compact title="Nothing here" description={empty} />
    ) : (
      <ul className="divide-y divide-border-subtle">
        {items.map((i) => (
          <ItemRow key={i.productId} item={i} metric={metric} />
        ))}
      </ul>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Inventory health"
          description={`${formatNumber(overview.stockUnits)} units across ${overview.totalProducts} products`}
          actions={<ProvenanceTag kind="calculated" />}
        />
        <CardBody className="space-y-5">
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-semibold tracking-tight">{formatCurrencyCompact(overview.stockValue)}</span>
            <span className="text-xs text-fg-muted">at cost · {formatCurrencyCompact(overview.retailValue)} at selling price</span>
          </div>
          <InventoryHealthIndicator breakdown={overview.movement} />
          <div>
            <div className="mb-2 text-xs font-medium text-fg-secondary">Stock ageing · average days held</div>
            <BarList
              color="var(--chart-1)"
              items={overview.ageing.map((a) => ({ key: a.bucket, label: `${a.bucket} days`, value: a.stockValue, display: formatCurrencyCompact(a.stockValue), secondary: `${formatNumber(a.units)} units` }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle text-center">
            {[
              { label: "Low stock", value: overview.lowStockCount, href: "/inventory/products?view=low-stock" },
              { label: "Out of stock", value: overview.outOfStockCount, href: "/inventory/products?view=out-of-stock" },
              { label: "Units on order", value: overview.onOrderUnits, href: "/procurement/orders" },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="bg-surface px-2 py-2.5 hover:bg-surface-hover">
                <div className="num text-lg font-semibold">{formatNumber(s.value)}</div>
                <div className="text-2xs text-fg-muted">{s.label}</div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader
          title="Inventory intelligence"
          description="What is moving, what is not, and what to re-order"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/inventory/decisions">Keep / replace / eliminate</Link>
            </Button>
          }
          className="pb-1"
        />
        <TabbedPanel
          panels={[
            { value: "slow", label: "Not moving", count: slow.length, content: list(slow, "tied", "No slow or dead stock right now.") },
            { value: "low", label: "Low stock", count: low.length, content: list(low, "stock", "Every product is above its re-order level.") },
            { value: "fast", label: "Fast movers", count: fast.length, content: list(fast, "velocity", "No fast movers in the last 90 days.") },
          ]}
        />
      </Card>
    </div>
  );
}
