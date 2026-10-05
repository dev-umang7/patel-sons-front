import type { Metadata } from "next";
import { PAYMENT_MODE_LABEL } from "@/components/business/badges";
import { BarList } from "@/components/charts/bar-list";
import { TrendChart } from "@/components/charts/charts";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { ExportButton } from "@/components/forms/filter-bar";
import { Section } from "@/components/layout/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { customerRepository, productRepository, reportRepository } from "@/data-access";
import { loadReportContext } from "@/features/reports/load";
import { ReportShell } from "@/features/reports/report-shell";
import { ReportTable } from "@/features/reports/report-table";
import { formatCurrencyCompact, formatPercent } from "@/lib/format";
import { percentChange } from "@/lib/utils";

export const metadata: Metadata = { title: "Sales report" };

export default async function SalesReportPage({ searchParams }: PageProps<"/reports/sales">) {
  const { meta, period, filters, reportPeriod } = await loadReportContext(await searchParams);
  const [r, categories, brands, customers] = await Promise.all([
    reportRepository.getSalesReport(reportPeriod, filters),
    productRepository.listCategoryOptions(),
    productRepository.listBrandOptions(),
    customerRepository.listCustomerOptions(),
  ]);
  const t = r.totals;
  const p = r.previous;
  const byCategory = r.byCategory.map((c) => ({ ...c, growth: percentChange(c.revenue, c.previousRevenue) }));

  return (
    <ReportShell
      title="Sales"
      description="Sales, units, categories, products and customers for the period."
      period={period}
      meta={meta}
      filters={[
        { key: "category", label: "Categories", options: categories },
        { key: "brand", label: "Brands", options: brands },
        { key: "customer", label: "Customers", options: customers },
      ]}
      actions={<ExportButton filename="patel-sons-sales-products.csv" rows={r.topProducts.map((x) => ({ Product: x.name, SKU: x.sku, Category: x.categoryName, Units: x.units, Revenue: x.revenue, "Gross profit": x.grossProfit, "Margin %": x.marginPercent.toFixed(1) }))} label="Export products" />}
    >
      <MetricStrip columns={5}>
        <Metric label="Sales" value={t.revenue} previous={p.revenue} emphasis />
        <Metric label="Units" value={t.units} previous={p.units} format="number" />
        <Metric label="Bills" value={t.bills} previous={p.bills} format="number" />
        <Metric label="Average bill" value={t.avgBill} previous={p.avgBill} format="currency" />
        <Metric label="Gross margin" value={t.grossMarginPercent} format="percent" caption={`${formatCurrencyCompact(t.grossProfit)} gross profit`} />
      </MetricStrip>

      <Card>
        <CardHeader title="Sales over time" />
        <CardBody>
          <TrendChart data={r.trend.map((x) => ({ bucket: x.bucket, value: x.revenue, previous: x.previousRevenue }))} granularity={period.granularity} label="Sales" height={260} />
        </CardBody>
      </Card>

      <Section title="By category">
        <ReportTable
          rowKey={(c) => c.categoryId}
          href={(c) => `/inventory/categories/${c.categoryId}`}
          rows={byCategory}
          columns={[
            { key: "name", label: "Category" },
            { key: "revenue", label: "Sales", format: "currency" },
            { key: "growth", label: "vs previous", format: "signed-percent" },
            { key: "units", label: "Units", format: "number" },
            { key: "grossProfit", label: "Gross profit", format: "currency" },
            { key: "marginPercent", label: "Margin", format: "percent" },
            { key: "share", label: "Share", format: "percent" },
          ]}
        />
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Top products">
          <ReportTable
            rowKey={(x) => x.productId}
            href={(x) => `/inventory/products/${x.productId}`}
            rows={r.topProducts}
            columns={[
              { key: "name", label: "Product" },
              { key: "units", label: "Units", format: "number" },
              { key: "revenue", label: "Sales", format: "currency" },
              { key: "marginPercent", label: "Margin", format: "percent" },
            ]}
          />
        </Section>
        <Section title="Top customers" description="Registered customers only">
          <ReportTable
            rowKey={(x) => x.customerId}
            href={(x) => `/crm/customers/${x.customerId}`}
            rows={r.topCustomers}
            columns={[
              { key: "name", label: "Customer" },
              { key: "bills", label: "Bills", format: "number" },
              { key: "revenue", label: "Sales", format: "currency" },
              { key: "grossProfit", label: "Gross profit", format: "currency" },
            ]}
          />
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Payment modes" />
          <CardBody>
            <BarList items={[...r.byPaymentMode].sort((a, b) => b.amount - a.amount).map((m) => ({ key: m.mode, label: PAYMENT_MODE_LABEL[m.mode], value: m.amount, display: formatCurrencyCompact(m.amount), secondary: `${m.bills} bills` }))} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Least sold" description="Lowest sales in the period — candidates for clearance" />
          <CardBody>
            <BarList color="var(--status-warning)" items={r.bottomProducts.slice(0, 6).map((x) => ({ key: x.productId, label: x.name, value: x.revenue, display: formatCurrencyCompact(x.revenue), secondary: `${x.units} units`, href: `/inventory/products/${x.productId}` }))} />
          </CardBody>
        </Card>
      </div>
      <p className="text-2xs text-fg-muted">Gift bills: {r.giftBills.bills} bills · {formatCurrencyCompact(r.giftBills.revenue)} ({formatPercent(t.revenue ? (r.giftBills.revenue / t.revenue) * 100 : 0)} of sales).</p>
    </ReportShell>
  );
}
