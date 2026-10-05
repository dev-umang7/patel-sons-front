import type { Metadata } from "next";
import { ColumnChart } from "@/components/charts/charts";
import { SERIES } from "@/components/charts/palette";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { ExportButton } from "@/components/forms/filter-bar";
import { Section } from "@/components/layout/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { reportRepository } from "@/data-access";
import { loadReportContext } from "@/features/reports/load";
import { ExpenseEntries } from "@/features/reports/expense-entries";
import { ReportShell } from "@/features/reports/report-shell";
import { ReportTable } from "@/features/reports/report-table";
import { percentChange } from "@/lib/utils";

export const metadata: Metadata = { title: "Expense report" };

/** At most seven named series in the stacked chart; the rest fold into "Other". */
const MAX_SERIES = 7;

export default async function ExpenseReportPage({ searchParams }: PageProps<"/reports/expenses">) {
  const { meta, period, reportPeriod } = await loadReportContext(await searchParams, "fytd");
  const r = await reportRepository.getExpenseReport(reportPeriod);
  const named = r.byCategory.slice(0, MAX_SERIES);
  const other = r.byCategory.slice(MAX_SERIES);
  const chartData = r.monthly.map((m) => {
    const row: Record<string, string | number> = { month: m.month };
    for (const c of named) row[c.category] = (m[c.category] as number | undefined) ?? 0;
    if (other.length) row.other = other.reduce((a, c) => a + ((m[c.category] as number | undefined) ?? 0), 0);
    return row;
  });
  const series = [...named.map((c, i) => ({ key: c.category, label: c.label, color: SERIES[i] })), ...(other.length ? [{ key: "other", label: "Other", color: SERIES[MAX_SERIES] }] : [])];
  const rows = r.byCategory.map((c) => ({ ...c, change: percentChange(c.amount, c.previousAmount), ofRevenue: r.revenue ? (c.amount / r.revenue) * 100 : 0 }));

  return (
    <ReportShell
      title="Expenses"
      description="Operating expenses by category and month, and how they compare with sales."
      period={period}
      meta={meta}
      actions={<ExportButton filename="patel-sons-expenses.csv" rows={r.entries.map((e) => ({ Date: e.date, Category: e.category, Description: e.description, Payee: e.payee, Amount: e.amount }))} />}
    >
      <MetricStrip columns={4}>
        <Metric label="Expenses" value={r.total} previous={r.previousTotal} upIsGood={false} emphasis />
        <Metric label="As a share of sales" value={r.revenue ? (r.total / r.revenue) * 100 : 0} format="percent" caption="of sales in the period" />
        <Metric label="Largest expense" value={r.byCategory[0]?.amount ?? 0} caption={r.byCategory[0]?.label} />
        <Metric label="Allocated to categories" value={r.allocatedToCategories.reduce((a, c) => a + c.amount, 0)} caption="tagged entries only" />
      </MetricStrip>
      <Card>
        <CardHeader title="Expenses by month" />
        <CardBody>
          <ColumnChart data={chartData} xKey="month" series={series} stacked height={280} />
        </CardBody>
      </Card>
      <Section title="By expense category">
        <ReportTable
          rowKey={(c) => c.category}
          rows={rows}
          columns={[
            { key: "label", label: "Category" },
            { key: "amount", label: "Amount", format: "currency" },
            { key: "change", label: "vs previous", format: "signed-percent", tone: "up-bad" },
            { key: "share", label: "Share", format: "percent" },
            { key: "ofRevenue", label: "% of sales", format: "percent" },
          ]}
        />
      </Section>
      <Section title="Entries">
        <ExpenseEntries entries={r.entries} />
      </Section>
    </ReportShell>
  );
}
