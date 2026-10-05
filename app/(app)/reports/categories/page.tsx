import type { Metadata } from "next";
import { ColumnChart } from "@/components/charts/charts";
import { ExportButton } from "@/components/forms/filter-bar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { reportRepository } from "@/data-access";
import { loadReportContext } from "@/features/reports/load";
import { ReportShell } from "@/features/reports/report-shell";
import { ReportTable } from "@/features/reports/report-table";
import { formatCurrency, formatPercent } from "@/lib/format";
import { percentChange } from "@/lib/utils";

export const metadata: Metadata = { title: "Category-wise report" };

export default async function CategoryReportPage({ searchParams }: PageProps<"/reports/categories">) {
  const { meta, period, reportPeriod } = await loadReportContext(await searchParams);
  const rows = (await reportRepository.getCategoryReport(reportPeriod)).map((c) => ({ ...c, growth: percentChange(c.revenue, c.previousRevenue), nonFast: c.slowCount + c.deadCount }));
  const sum = (k: "revenue" | "grossProfit" | "purchases" | "stockValue" | "expensesAllocated") => rows.reduce((a, r) => a + r[k], 0);

  return (
    <ReportShell
      title="Category-wise report"
      description="Sales, purchases, profit, stock and movement for each category, side by side."
      period={period}
      meta={meta}
      actions={<ExportButton filename="patel-sons-categories.csv" rows={rows.map((c) => ({ Category: c.name, Sales: c.revenue, "Gross profit": c.grossProfit, "Margin %": c.marginPercent.toFixed(1), Purchases: c.purchases, "Stock value": c.stockValue, "Slow/dead products": c.nonFast }))} />}
    >
      <Card>
        <CardHeader title="Sales vs purchases by category" description="Buying more than selling builds stock; the reverse draws it down" />
        <CardBody>
          <ColumnChart
            data={rows.map((r) => ({ name: r.name, revenue: r.revenue, purchases: r.purchases }))}
            xKey="name"
            xFormat="raw"
            series={[
              { key: "revenue", label: "Sales", color: "var(--chart-1)" },
              { key: "purchases", label: "Purchases", color: "var(--chart-2)" },
            ]}
            height={260}
          />
        </CardBody>
      </Card>
      <ReportTable
        rowKey={(c) => c.categoryId}
        href={(c) => `/inventory/categories/${c.categoryId}`}
        rows={rows}
        caption="Category-wise performance"
        columns={[
          { key: "name", label: "Category" },
          { key: "revenue", label: "Sales", format: "currency" },
          { key: "growth", label: "vs previous", format: "signed-percent" },
          { key: "grossProfit", label: "Gross profit", format: "currency" },
          { key: "marginPercent", label: "Margin", format: "percent" },
          { key: "purchases", label: "Purchases", format: "currency" },
          { key: "stockValue", label: "Stock value", format: "currency" },
          { key: "fastCount", label: "Fast", format: "number" },
          { key: "nonFast", label: "Slow / dead", format: "number" },
          { key: "expensesAllocated", label: "Expenses allocated", format: "currency" },
        ]}
        totals={{
          revenue: formatCurrency(sum("revenue")),
          grossProfit: formatCurrency(sum("grossProfit")),
          marginPercent: formatPercent(sum("revenue") ? (sum("grossProfit") / sum("revenue")) * 100 : 0),
          purchases: formatCurrency(sum("purchases")),
          stockValue: formatCurrency(sum("stockValue")),
          expensesAllocated: formatCurrency(sum("expensesAllocated")),
        }}
      />
      <p className="text-2xs text-fg-muted">Stock value and movement counts reflect stock today, not the selected period. Only expenses explicitly tagged to a category are allocated.</p>
    </ReportShell>
  );
}
