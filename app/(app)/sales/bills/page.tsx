import type { Metadata } from "next";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { PeriodPicker } from "@/components/forms/period-picker";
import { Page, PageHeader } from "@/components/layout/page";
import { metaRepository, salesRepository } from "@/data-access";
import { BillsTable } from "@/features/sales/bills-table";
import { resolvePeriod } from "@/lib/period";
import { periodParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Bills" };

export default async function BillsPage({ searchParams }: PageProps<"/sales/bills">) {
  const meta = await metaRepository.getMeta();
  const period = resolvePeriod(periodParams(await searchParams), meta.asOf);
  const bills = await salesRepository.listBills(period);
  const total = bills.reduce((a, b) => a + b.net, 0);
  const gift = bills.filter((b) => b.kind === "gift");
  return (
    <Page>
      <PageHeader eyebrow="Sales" title="Bills" description="Every invoice raised in the period. Open a bill to see what it did to stock, profit, loyalty and dues." actions={<PeriodPicker period={period} asOf={meta.asOf} historyStart={meta.historyStart} />} />
      <MetricStrip columns={4} className="mb-6">
        <Metric label="Bills" value={bills.length} format="number" />
        <Metric label="Billed" value={total} />
        <Metric label="Gift bills" value={gift.length} format="number" caption="what counts as a gift bill is an open question" />
        <Metric label="Walk-in share" value={bills.length ? (bills.filter((b) => !b.customerId).length / bills.length) * 100 : 0} format="percent" caption="bills without a registered customer" />
      </MetricStrip>
      <BillsTable bills={bills} />
    </Page>
  );
}
