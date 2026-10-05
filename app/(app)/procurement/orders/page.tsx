import type { Metadata } from "next";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { metaRepository, purchaseRepository } from "@/data-access";
import { ProcurementLifecycle } from "@/features/procurement/lifecycle";
import { NewPurchaseOrderDialog } from "@/features/procurement/new-po-dialog";
import { PurchasesTable } from "@/features/procurement/purchases-table";
import { param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Purchase orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/procurement/orders">) {
  const sp = await searchParams;
  const [all, quotes, meta] = await Promise.all([purchaseRepository.listPurchases(), purchaseRepository.listQuoteOptions(), metaRepository.getMeta()]);
  const open = all.filter((p) => p.status === "draft" || p.status === "ordered" || p.status === "partially-received");
  const late = open.filter((p) => p.isLate);

  return (
    <Page>
      <PageHeader
        eyebrow="Procurement"
        title="Purchase orders"
        description="Orders being drafted, placed with vendors or partly received. Received orders move to Purchases."
        meta={<ProcurementLifecycle current="purchase" completedThrough="decide" />}
        actions={<NewPurchaseOrderDialog quotes={quotes} asOf={meta.asOf} initialOpen={param(sp, "new") === "1"} initialProductId={param(sp, "product")} initialVendorId={param(sp, "vendor")} />}
      />
      <div className="space-y-8">
        <MetricStrip columns={4}>
          <Metric label="Open orders" value={open.length} format="number" caption={`${open.filter((p) => p.status === "draft").length} drafts awaiting a decision`} />
          <Metric label="Value on order" value={open.reduce((a, p) => a + p.value, 0)} />
          <Metric label="Units still to arrive" value={open.reduce((a, p) => a + p.units - p.receivedUnits, 0)} format="number" />
          <Metric label="Past expected date" value={late.length} format="number" caption={late.map((p) => p.vendorName).join(", ") || "All on schedule"} />
        </MetricStrip>
        <Section title="Open orders">
          <PurchasesTable purchases={open} mode="orders" />
        </Section>
      </div>
    </Page>
  );
}
