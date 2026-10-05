import type { Metadata } from "next";
import Link from "next/link";
import { MOVEMENT_META } from "@/components/business/badges";
import { MOVEMENT_COLOR } from "@/components/business/movement";
import { ProductThumb } from "@/components/business/product-thumb";
import { SegmentBar } from "@/components/charts/bar-list";
import { Page, PageHeader } from "@/components/layout/page";
import { Legend } from "@/components/charts/chart-tooltip";
import { productRepository } from "@/data-access";
import type { MovementClass } from "@/data-access/types";
import { formatCurrencyCompact, formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Categories" };

const CLASSES: MovementClass[] = ["fast", "normal", "slow", "dead"];

export default async function CategoriesPage() {
  const categories = (await productRepository.listCategories()).sort((a, b) => b.revenue90 - a.revenue90);
  return (
    <Page>
      <PageHeader eyebrow="Inventory" title="Categories" description="Category analysis — sales, margin, stock and how each category's products are moving." />
      <Legend className="mb-3" items={CLASSES.map((m) => ({ label: MOVEMENT_META[m].label, color: MOVEMENT_COLOR[m], kind: "box" as const }))} />
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        <div className="hidden grid-cols-[2fr_repeat(4,1fr)_1.6fr] gap-4 border-b border-border px-4 py-2.5 text-xs font-medium text-fg-muted md:grid">
          <span>Category</span>
          <span className="text-right">Sales · 90d</span>
          <span className="text-right">Margin</span>
          <span className="text-right">Stock value</span>
          <span className="text-right">Products</span>
          <span>Movement mix</span>
        </div>
        <ul className="divide-y divide-border-subtle">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/inventory/categories/${c.id}`} className="grid grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-surface-hover md:grid-cols-[2fr_repeat(4,1fr)_1.6fr]">
                <span className="col-span-2 flex items-center gap-3 md:col-span-1">
                  <ProductThumb categoryName={c.name} size="md" />
                  <span className="min-w-0">
                    <span className="block font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-fg-muted">{c.description}</span>
                  </span>
                </span>
                <span className="num text-sm md:text-right"><span className="text-xs text-fg-muted md:hidden">Sales </span>{formatCurrencyCompact(c.revenue90)}</span>
                <span className="num text-sm md:text-right"><span className="text-xs text-fg-muted md:hidden">Margin </span>{formatPercent(c.marginPercent)}</span>
                <span className="num text-sm md:text-right"><span className="text-xs text-fg-muted md:hidden">Stock </span>{formatCurrencyCompact(c.stockValue)}</span>
                <span className="num text-sm md:text-right"><span className="text-xs text-fg-muted md:hidden">Products </span>{c.products} · {c.brands} brands</span>
                <span className="col-span-2 md:col-span-1">
                  <SegmentBar label={`Movement mix for ${c.name}`} segments={CLASSES.map((m) => ({ key: m, label: MOVEMENT_META[m].label, value: c.movement[m], color: MOVEMENT_COLOR[m] }))} />
                  <span className="mt-1 block text-2xs text-fg-muted">
                    {c.movement.fast} fast · {c.movement.slow + c.movement.dead} slow or dead
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Page>
  );
}
