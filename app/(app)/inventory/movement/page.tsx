import type { Metadata } from "next";
import { ColumnChart } from "@/components/charts/charts";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { PeriodPicker } from "@/components/forms/period-picker";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { inventoryRepository, metaRepository } from "@/data-access";
import { MovementTable } from "@/features/inventory/movement-table";
import { bucketOf, resolvePeriod } from "@/lib/period";
import { periodParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Stock movement" };

export default async function MovementPage({ searchParams }: PageProps<"/inventory/movement">) {
  const meta = await metaRepository.getMeta();
  const period = resolvePeriod(periodParams(await searchParams), meta.asOf);
  const rows = await inventoryRepository.listStockMovements(period);
  const sum = (type: string) => rows.filter((r) => r.type === type).reduce((a, r) => a + r.quantity, 0);
  const buckets = new Map<string, { bucket: string; received: number; sold: number }>();
  for (const r of [...rows].reverse()) {
    const k = bucketOf(r.date, period.granularity);
    const b = buckets.get(k) ?? { bucket: k, received: 0, sold: 0 };
    if (r.type === "purchase") b.received += r.quantity;
    if (r.type === "sale") b.sold += -r.quantity;
    buckets.set(k, b);
  }

  return (
    <Page>
      <PageHeader eyebrow="Inventory" title="Stock movement" description="Every unit in and out — goods received against purchases, units sold on bills and stock adjustments." actions={<PeriodPicker period={period} asOf={meta.asOf} historyStart={meta.historyStart} />} />
      <div className="space-y-8">
        <MetricStrip columns={4}>
          <Metric label="Units received" value={sum("purchase")} format="number" caption="against purchases" />
          <Metric label="Units sold" value={-sum("sale")} format="number" caption="on bills" />
          <Metric label="Adjustments" value={sum("adjustment")} format="number" caption="damage, returns, counts" />
          <Metric label="Net change" value={sum("purchase") + sum("sale") + sum("adjustment")} format="number" caption="units" />
        </MetricStrip>
        <Card>
          <CardHeader title="Received vs sold" description={`Units per ${period.granularity}`} />
          <CardBody>
            <ColumnChart
              data={[...buckets.values()]}
              xKey="bucket"
              xFormat={period.granularity === "month" ? "month" : "day"}
              format="number"
              series={[
                { key: "received", label: "Received", color: "var(--chart-1)" },
                { key: "sold", label: "Sold", color: "var(--chart-3)" },
              ]}
              height={240}
            />
          </CardBody>
        </Card>
        <Section title="Movement ledger">
          <MovementTable rows={rows} />
        </Section>
      </div>
    </Page>
  );
}
