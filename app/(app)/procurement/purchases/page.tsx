import type { Metadata } from "next";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Page, PageHeader } from "@/components/layout/page";
import { purchaseRepository } from "@/data-access";
import { ProcurementLifecycle } from "@/features/procurement/lifecycle";
import { PurchasesTable } from "@/features/procurement/purchases-table";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage() {
  const all = await purchaseRepository.listPurchases();
  const done = all.filter((p) => p.status !== "draft");
  const received = done.filter((p) => p.status === "received");
  return (
    <Page>
      <PageHeader eyebrow="Procurement" title="Purchases" description="Purchase history — what was bought, from whom, at what cost, and when it arrived." meta={<ProcurementLifecycle current="receive" completedThrough="purchase" />} />
      <MetricStrip columns={4} className="mb-6">
        <Metric label="Purchases · 12 months" value={received.length} format="number" />
        <Metric label="Value received" value={received.reduce((a, p) => a + p.value, 0)} />
        <Metric label="Saved through vendor offers" value={done.reduce((a, p) => a + p.savings, 0)} />
        <Metric label="Delivered late" value={received.filter((p) => p.daysLate > 0).length} format="number" caption={`of ${received.length} received`} />
      </MetricStrip>
      <PurchasesTable purchases={done} mode="history" />
    </Page>
  );
}
