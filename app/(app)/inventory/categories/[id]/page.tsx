import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InventoryHealthIndicator } from "@/components/business/movement";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart } from "@/components/charts/charts";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { productRepository } from "@/data-access";
import type { MovementClass } from "@/data-access/types";
import { InventoryTable } from "@/features/inventory/inventory-table";
import { formatCurrencyCompact, formatPercent } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/inventory/categories/[id]">): Promise<Metadata> {
  const c = await productRepository.getCategory((await params).id);
  return { title: c?.name ?? "Category" };
}

export default async function CategoryPage({ params }: PageProps<"/inventory/categories/[id]">) {
  const c = await productRepository.getCategory((await params).id);
  if (!c) notFound();
  const year = c.monthly.reduce((a, m) => ({ revenue: a.revenue + m.revenue, gp: a.gp + m.grossProfit, purchases: a.purchases + m.purchases }), { revenue: 0, gp: 0, purchases: 0 });
  const breakdown = (["fast", "normal", "slow", "dead"] as MovementClass[]).map((m) => {
    const items = c.items.filter((i) => i.movement === m);
    return { movement: m, products: items.length, stockValue: items.reduce((a, i) => a + i.stockValue, 0), units: items.reduce((a, i) => a + i.stockOnHand, 0) };
  });

  return (
    <Page>
      <PageHeader back={{ href: "/inventory/categories", label: "All categories" }} eyebrow="Category" title={c.name} description={c.description} />
      <div className="space-y-8">
        <MetricStrip columns={6}>
          <Metric label="Sales · 12 months" value={year.revenue} emphasis />
          <Metric label="Gross profit · 12 months" value={year.gp} caption={`${formatPercent(year.revenue ? (year.gp / year.revenue) * 100 : 0)} margin`} />
          <Metric label="Purchases · 12 months" value={year.purchases} />
          <Metric label="Stock value" value={c.stockValue} caption={`${c.stockUnits} units`} />
          <Metric label="Slow or dead" value={c.movement.slow + c.movement.dead} format="number" caption={`of ${c.products} products`} />
          <Metric label="Expenses allocated" value={c.expenses} caption="allocation policy is an open question" />
        </MetricStrip>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Sales, gross profit and purchases by month" />
            <CardBody>
              <ColumnChart
                data={c.monthly}
                xKey="month"
                series={[
                  { key: "revenue", label: "Sales", color: "var(--chart-1)" },
                  { key: "grossProfit", label: "Gross profit", color: "var(--chart-3)" },
                  { key: "purchases", label: "Purchases", color: "var(--chart-2)" },
                ]}
                height={260}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Movement" />
            <CardBody>
              <InventoryHealthIndicator breakdown={breakdown} />
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Brands" description="Sales over 12 months" />
            <CardBody>
              <BarList items={c.brandsBreakdown.map((b) => ({ key: b.brandId, label: b.name, value: b.revenue, display: formatCurrencyCompact(b.revenue), secondary: `${b.products} products`, href: `/inventory/brands?brand=${b.brandId}` }))} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Vendors" description="Value received over 12 months" />
            <CardBody>
              <BarList color="var(--chart-2)" items={c.vendors.map((v) => ({ key: v.vendorId, label: v.name, value: v.value, display: formatCurrencyCompact(v.value), href: `/procurement/vendors/${v.vendorId}` }))} />
            </CardBody>
          </Card>
        </div>

        <Section title="Products in this category">
          <InventoryTable items={c.items} />
        </Section>
      </div>
    </Page>
  );
}
