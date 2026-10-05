import type { Metadata } from "next";
import Link from "next/link";
import { PAYMENT_MODE_LABEL, MovementBadge } from "@/components/business/badges";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart, TrendChart } from "@/components/charts/charts";
import { Delta, Metric, MetricStrip } from "@/components/data-display/metrics";
import { PeriodPicker } from "@/components/forms/period-picker";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { metaRepository, reportRepository, salesRepository } from "@/data-access";
import { BillsTable } from "@/features/sales/bills-table";
import { maxDate, startOfMonth } from "@/lib/dates";
import { formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/format";
import { resolvePeriod } from "@/lib/period";
import { periodParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Sales" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SalesPage({ searchParams }: PageProps<"/sales">) {
  const meta = await metaRepository.getMeta();
  const period = resolvePeriod(periodParams(await searchParams), meta.asOf);
  const [report, bills] = await Promise.all([
    reportRepository.getSalesReport({ range: period, previous: period.previous, granularity: period.granularity }),
    salesRepository.listBills({ from: maxDate(period.from, startOfMonth(period.to)), to: period.to }),
  ]);
  const { totals, previous } = report;
  const notSelling = report.bottomProducts.filter((p) => p.units <= 1).slice(0, 6);

  return (
    <Page>
      <PageHeader
        eyebrow="Sales"
        title="What is selling — and what isn't"
        description="Bills, units and margin for the period, how customers pay, and the products that are not moving."
        actions={
          <>
            <PeriodPicker period={period} asOf={meta.asOf} historyStart={meta.historyStart} />
            <Button asChild>
              <Link href="/reports/sales">Full sales report</Link>
            </Button>
          </>
        }
      />
      <div className="space-y-8">
        <MetricStrip columns={6}>
          <Metric label="Sales" value={totals.revenue} previous={previous.revenue} emphasis />
          <Metric label="Bills" value={totals.bills} previous={previous.bills} format="number" />
          <Metric label="Average bill" value={totals.avgBill} previous={previous.avgBill} format="currency" />
          <Metric label="Units sold" value={totals.units} previous={previous.units} format="number" />
          <Metric label="Gross margin" value={totals.grossMarginPercent} format="percent" caption={`${formatCurrencyCompact(totals.grossProfit)} gross profit`} />
          <Metric label="Sold on credit" value={totals.creditSales} caption="adds to debt" href="/sales/collections" />
        </MetricStrip>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Sales trend" description="Against the previous period" actions={<Delta current={totals.revenue} previous={previous.revenue} />} />
            <CardBody>
              <TrendChart data={report.trend.map((t) => ({ bucket: t.bucket, value: t.revenue, previous: t.previousRevenue }))} granularity={period.granularity} label="Sales" height={260} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="How customers pay" description="Share of sales by payment mode" />
            <CardBody>
              <BarList
                color="var(--chart-1)"
                items={[...report.byPaymentMode]
                  .sort((a, b) => b.amount - a.amount)
                  .map((m) => ({ key: m.mode, label: PAYMENT_MODE_LABEL[m.mode], value: m.amount, display: formatCurrencyCompact(m.amount), secondary: `${m.bills} bills`, href: m.mode === "credit" ? "/sales/collections" : undefined }))}
              />
              <div className="mt-5 rounded-md bg-brass-soft px-3 py-2.5 text-xs">
                <span className="font-medium text-brass">Gift bills</span>
                <span className="text-fg-secondary">
                  {" "}
                  · {formatNumber(report.giftBills.bills)} bills, {formatCurrencyCompact(report.giftBills.revenue)} ({formatPercent(totals.revenue ? (report.giftBills.revenue / totals.revenue) * 100 : 0, 0)} of sales)
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Busiest days" description="Sales by day of week" />
            <CardBody>
              <ColumnChart data={report.byWeekday.map((w) => ({ day: WEEKDAYS[w.weekday], revenue: w.revenue }))} xKey="day" xFormat="raw" series={[{ key: "revenue", label: "Sales", color: "var(--chart-primary)" }]} height={200} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Top sellers" />
            <ul className="divide-y divide-border-subtle border-t border-border-subtle">
              {report.topProducts.slice(0, 6).map((p) => (
                <li key={p.productId}>
                  <Link href={`/inventory/products/${p.productId}`} className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-surface-hover">
                    <span className="min-w-0 truncate text-sm">{p.name}</span>
                    <span className="num shrink-0 text-xs text-fg-muted">
                      {p.units} · <span className="font-medium text-fg">{formatCurrencyCompact(p.revenue)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Not selling" description="In stock, one unit or fewer sold this period" />
            <ul className="divide-y divide-border-subtle border-t border-border-subtle">
              {notSelling.map((p) => (
                <li key={p.productId}>
                  <Link href={`/inventory/products/${p.productId}`} className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-surface-hover">
                    <span className="min-w-0 truncate text-sm">{p.name}</span>
                    <MovementBadge movement={p.movement} compact />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border-subtle px-4 py-2.5">
              <Button asChild variant="ghost" size="sm">
                <Link href="/inventory/slow-moving">How to move slow stock</Link>
              </Button>
            </div>
          </Card>
        </div>

        <Section
          title="Recent bills"
          description="This month so far"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/sales/bills">All bills</Link>
            </Button>
          }
        >
          <BillsTable bills={bills} compact />
        </Section>
      </div>
    </Page>
  );
}
