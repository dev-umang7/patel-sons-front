import type { Metadata } from "next";
import { ColumnChart } from "@/components/charts/charts";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { ExportButton } from "@/components/forms/filter-bar";
import { Notice } from "@/components/feedback/states";
import { Section } from "@/components/layout/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { reportRepository } from "@/data-access";
import { MARGIN_RULES } from "@/data-access/rules/assumptions";
import { loadReportContext } from "@/features/reports/load";
import { ReportShell } from "@/features/reports/report-shell";
import { ReportTable } from "@/features/reports/report-table";
import { formatCurrency, formatMonthLong, formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Profit report" };

export default async function ProfitReportPage({ searchParams }: PageProps<"/reports/profit">) {
  const { meta, period, reportPeriod } = await loadReportContext(await searchParams, "fytd");
  const r = await reportRepository.getProfitReport(reportPeriod);
  const t = r.totals;
  const p = r.previous;
  const monthly = r.monthly.map((m) => ({ ...m, label: formatMonthLong(m.month), margin: m.revenue ? (m.netProfit / m.revenue) * 100 : 0 }));

  return (
    <ReportShell
      title="Profit"
      description="Revenue less the cost of goods sold gives gross profit; less operating expenses gives the net view."
      period={period}
      meta={meta}
      actions={<ExportButton filename="patel-sons-profit.csv" rows={monthly.map((m) => ({ Month: m.label, Revenue: m.revenue, COGS: m.cogs, "Gross profit": m.grossProfit, Expenses: m.expenses, "Net profit": m.netProfit }))} />}
    >
      <MetricStrip columns={5}>
        <Metric label="Revenue" value={t.revenue} previous={p.revenue} emphasis />
        <Metric label="Cost of goods sold" value={t.cogs} previous={p.cogs} upIsGood={false} />
        <Metric label="Gross profit" value={t.grossProfit} previous={p.grossProfit} caption={`${formatPercent(t.grossMarginPercent)} margin`} />
        <Metric label="Expenses" value={t.expenses} previous={p.expenses} upIsGood={false} />
        <Metric label="Net profit" value={t.netProfit} previous={p.netProfit} caption={`${formatPercent(t.netMarginPercent)} of revenue`} />
      </MetricStrip>

      <Card>
        <CardHeader title="Gross and net profit by month" description="Net profit = gross profit − operating expenses" />
        <CardBody>
          <ColumnChart
            data={r.monthly}
            xKey="month"
            series={[
              { key: "grossProfit", label: "Gross profit", color: "var(--chart-1)" },
              { key: "netProfit", label: "Net profit", color: "var(--chart-3)" },
            ]}
            height={260}
          />
        </CardBody>
      </Card>

      <Section title="Monthly statement">
        <ReportTable
          rowKey={(m) => m.month}
          rows={monthly}
          columns={[
            { key: "label", label: "Month" },
            { key: "revenue", label: "Revenue", format: "currency" },
            { key: "cogs", label: "COGS", format: "currency" },
            { key: "grossProfit", label: "Gross profit", format: "currency" },
            { key: "expenses", label: "Expenses", format: "currency" },
            { key: "netProfit", label: "Net profit", format: "currency" },
            { key: "margin", label: "Net margin", format: "percent" },
          ]}
          totals={{ revenue: formatCurrency(t.revenue), cogs: formatCurrency(t.cogs), grossProfit: formatCurrency(t.grossProfit), expenses: formatCurrency(t.expenses), netProfit: formatCurrency(t.netProfit), margin: formatPercent(t.netMarginPercent) }}
        />
      </Section>

      <Section title="Gross profit by category">
        <ReportTable
          rowKey={(c) => c.categoryId}
          href={(c) => `/inventory/categories/${c.categoryId}`}
          rows={r.byCategory}
          columns={[
            { key: "name", label: "Category" },
            { key: "revenue", label: "Revenue", format: "currency" },
            { key: "grossProfit", label: "Gross profit", format: "currency" },
            { key: "marginPercent", label: "Margin", format: "percent" },
            { key: "share", label: "Share of sales", format: "percent" },
          ]}
        />
      </Section>

      <Section id="low-margin" title={`Products below ${MARGIN_RULES.lowMarginPercent}% margin`} description="Sold in the period at a gross margin under the threshold">
        {r.lowMarginProducts.length === 0 ? (
          <Notice tone="info">No product sold below {MARGIN_RULES.lowMarginPercent}% margin in this period.</Notice>
        ) : (
          <ReportTable
            rowKey={(x) => x.productId}
            href={(x) => `/intelligence/pricing?product=${x.productId}`}
            rows={r.lowMarginProducts}
            columns={[
              { key: "name", label: "Product" },
              { key: "categoryName", label: "Category", format: "text" },
              { key: "units", label: "Units", format: "number" },
              { key: "revenue", label: "Revenue", format: "currency" },
              { key: "grossProfit", label: "Gross profit", format: "currency" },
              { key: "marginPercent", label: "Margin", format: "percent" },
            ]}
          />
        )}
      </Section>
      <Notice tone="info" title="Basis">
        Amounts are GST inclusive. Cost of goods uses the moving average cost at the time of sale. Expenses are recorded operating costs; how they should be allocated to categories is an open question.
      </Notice>
    </ReportShell>
  );
}
