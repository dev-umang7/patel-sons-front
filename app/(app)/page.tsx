import type { Metadata } from "next";
import Link from "next/link";
import { PeriodPicker } from "@/components/forms/period-picker";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Button } from "@/components/ui/button";
import { metaRepository, reportRepository } from "@/data-access";
import { AlertsPanel } from "@/features/dashboard/alerts-panel";
import { CollectionsSection } from "@/features/dashboard/collections-section";
import { InventorySection } from "@/features/dashboard/inventory-section";
import { ProcurementSection } from "@/features/dashboard/procurement-section";
import { SalesTrendCard, TopCategoriesCard, TopProductsCard } from "@/features/dashboard/sales-section";
import { formatDate, formatPercent } from "@/lib/format";
import { resolvePeriod } from "@/lib/period";
import { periodParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const meta = await metaRepository.getMeta();
  const period = resolvePeriod(periodParams(await searchParams), meta.asOf);
  const data = await reportRepository.getDashboard({ range: period, previous: period.previous, granularity: period.granularity });
  const { totals, previous } = data;

  return (
    <Page>
      <PageHeader
        eyebrow={`${meta.businessName} · as of ${formatDate(meta.asOf)}`}
        title="Business overview"
        description={`${period.label}, compared with the ${period.days} days before. Sales, margin, stock, purchasing and dues in one view.`}
        actions={
          <>
            <PeriodPicker period={period} asOf={meta.asOf} historyStart={meta.historyStart} />
            <Button asChild variant="secondary">
              <Link href="/reports">Reports</Link>
            </Button>
          </>
        }
      />

      <div className="space-y-10">
        <section aria-label="Executive summary">
          <MetricStrip columns={6}>
            <Metric label="Sales" value={totals.revenue} previous={previous.revenue} href="/reports/sales" emphasis />
            <Metric label="Gross profit" value={totals.grossProfit} previous={previous.grossProfit} caption={`${formatPercent(totals.grossMarginPercent)} margin`} href="/reports/profit" />
            <Metric label="Purchases received" value={totals.purchases} previous={previous.purchases} upIsGood={false} href="/reports/purchases" />
            <Metric label="Expenses" value={totals.expenses} previous={previous.expenses} upIsGood={false} href="/reports/expenses" />
            <Metric label="Outstanding debt" value={data.collections.totalOutstanding} caption={`${data.collections.customersOwing} customers`} href="/sales/collections" />
            <Metric label="Inventory value" value={data.inventory.stockValue} caption="at cost" href="/inventory" />
          </MetricStrip>
        </section>

        <div className="grid gap-4 xl:grid-cols-3">
          <SalesTrendCard className="xl:col-span-2" trend={data.trend} totals={totals} previous={previous} granularity={period.granularity} />
          <AlertsPanel alerts={data.alerts} />
        </div>

        <Section title="Sales performance" description="Which categories and products are driving the period">
          <div className="grid gap-4 lg:grid-cols-2">
            <TopCategoriesCard categories={data.topCategories} />
            <TopProductsCard products={data.topProducts} />
          </div>
        </Section>

        <Section title="Inventory" description="Stock position today, independent of the selected period">
          <InventorySection overview={data.inventory} fast={data.fastMovers} slow={data.slowMovers} low={data.lowStock} />
        </Section>

        <Section title="Procurement" description="Orders in flight, vendor offers and cost movements">
          <ProcurementSection data={data} />
        </Section>

        <Section title="Collection of debt" description="Credit sales awaiting payment">
          <CollectionsSection overview={data.collections} />
        </Section>
      </div>
    </Page>
  );
}
