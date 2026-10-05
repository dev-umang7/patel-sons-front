import type { Metadata } from "next";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart } from "@/components/charts/charts";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { ExportButton } from "@/components/forms/filter-bar";
import { Section } from "@/components/layout/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { productRepository, reportRepository, vendorRepository } from "@/data-access";
import { loadReportContext } from "@/features/reports/load";
import { ReportShell } from "@/features/reports/report-shell";
import { ReportTable } from "@/features/reports/report-table";
import { formatCurrencyCompact } from "@/lib/format";

export const metadata: Metadata = { title: "Purchase report" };

export default async function PurchaseReportPage({ searchParams }: PageProps<"/reports/purchases">) {
  const { meta, period, filters, reportPeriod } = await loadReportContext(await searchParams);
  const [r, vendors, categories, brands] = await Promise.all([reportRepository.getPurchaseReport(reportPeriod, filters), vendorRepository.listVendorOptions(), productRepository.listCategoryOptions(), productRepository.listBrandOptions()]);

  return (
    <ReportShell
      title="Purchases"
      description="Purchase volume by vendor, category and product — goods received in the period."
      period={period}
      meta={meta}
      filters={[
        { key: "vendor", label: "Vendors", options: vendors },
        { key: "category", label: "Categories", options: categories },
        { key: "brand", label: "Brands", options: brands },
      ]}
      actions={<ExportButton filename="patel-sons-purchases-by-vendor.csv" rows={r.byVendor.map((v) => ({ Vendor: v.name, Orders: v.orders, Units: v.units, Value: v.value, Savings: v.savings }))} />}
    >
      <MetricStrip columns={4}>
        <Metric label="Purchased" value={r.total} previous={r.previousTotal} upIsGood={false} emphasis />
        <Metric label="Purchases" value={r.orders} format="number" />
        <Metric label="Units received" value={r.units} format="number" />
        <Metric label="Saved through offers" value={r.savings} />
      </MetricStrip>
      <Card>
        <CardHeader title="Purchase volume" description={`Value received per ${period.granularity}`} />
        <CardBody>
          <ColumnChart data={r.byMonth} xKey="bucket" xFormat={period.granularity === "month" ? "month" : "day"} series={[{ key: "value", label: "Purchased", color: "var(--chart-2)" }]} height={240} />
        </CardBody>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="By vendor" className="lg:col-span-2">
          <ReportTable
            rowKey={(v) => v.vendorId}
            href={(v) => `/procurement/vendors/${v.vendorId}`}
            rows={r.byVendor}
            columns={[
              { key: "name", label: "Vendor" },
              { key: "orders", label: "Purchases", format: "number" },
              { key: "units", label: "Units", format: "number" },
              { key: "value", label: "Value", format: "currency" },
              { key: "share", label: "Share", format: "percent" },
              { key: "savings", label: "Offer savings", format: "currency" },
            ]}
          />
        </Section>
        <Card className="h-fit">
          <CardHeader title="By category" />
          <CardBody>
            <BarList color="var(--chart-2)" items={r.byCategory.map((c) => ({ key: c.categoryId, label: c.name, value: c.value, display: formatCurrencyCompact(c.value), secondary: `${c.units} units` }))} />
          </CardBody>
        </Card>
      </div>
      <Section title="Most purchased products">
        <ReportTable
          rowKey={(x) => x.productId}
          href={(x) => `/procurement/sources?product=${x.productId}`}
          rows={r.topProducts}
          columns={[
            { key: "name", label: "Product" },
            { key: "units", label: "Units", format: "number" },
            { key: "value", label: "Value", format: "currency" },
            { key: "avgCost", label: "Average cost", format: "currency" },
          ]}
        />
      </Section>
    </ReportShell>
  );
}
