import { Check, Circle, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseStatusBadge } from "@/components/business/badges";
import { KeyValue, Metric, MetricStrip } from "@/components/data-display/metrics";
import { Notice } from "@/components/feedback/states";
import { Page, PageHeader } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { purchaseRepository } from "@/data-access";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/procurement/purchases/[id]">): Promise<Metadata> {
  const p = await purchaseRepository.getPurchase((await params).id);
  return { title: p?.number ?? "Purchase" };
}

export default async function PurchasePage({ params }: PageProps<"/procurement/purchases/[id]">) {
  const p = await purchaseRepository.getPurchase((await params).id);
  if (!p) notFound();

  const steps = [
    { label: "Drafted", date: p.orderedOn, done: true },
    { label: "Ordered", date: p.status === "draft" ? null : p.orderedOn, done: p.status !== "draft" && p.status !== "cancelled" },
    { label: p.status === "partially-received" ? "Partly received" : "Received", date: p.receivedOn, done: p.status === "received" || p.status === "partially-received" },
    { label: "In inventory", date: p.status === "received" ? p.receivedOn : null, done: p.status === "received" },
  ];

  return (
    <Page width="narrow">
      <PageHeader
        back={{ href: p.status === "received" || p.status === "cancelled" ? "/procurement/purchases" : "/procurement/orders", label: "Back" }}
        eyebrow="Purchase"
        title={p.number}
        description={
          <>
            From{" "}
            <Link href={`/procurement/vendors/${p.vendorId}`} className="font-medium text-fg hover:underline">
              {p.vendorName}
            </Link>{" "}
            · ordered {formatDate(p.orderedOn)}
          </>
        }
        meta={
          <>
            <PurchaseStatusBadge status={p.status} />
            {p.isLate && <Badge tone="danger">{p.daysLate} days past expected</Badge>}
          </>
        }
      />
      <div className="space-y-6">
        {p.notes && <Notice tone={p.status === "cancelled" ? "warning" : "info"}>{p.notes}</Notice>}

        <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4" aria-label="Purchase progress">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5 bg-surface p-3">
              <span className={cn("grid size-6 place-items-center rounded-full", p.status === "cancelled" && !s.done ? "bg-surface-muted text-fg-subtle" : s.done ? "bg-success text-fg-inverse" : "border border-border-strong text-fg-subtle")}>
                {p.status === "cancelled" && s.label !== "Drafted" ? <X className="size-3" /> : s.done ? <Check className="size-3" strokeWidth={3} /> : <Circle className="size-2" />}
              </span>
              <span>
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="text-xs text-fg-muted">{s.date ? formatDate(s.date) : s.label === "Received" ? `expected ${formatDate(p.expectedOn)}` : "—"}</span>
              </span>
            </li>
          ))}
        </ol>

        <MetricStrip columns={4}>
          <Metric label="Order value" value={p.value} format="currency" />
          <Metric label="Units" value={p.units} format="number" caption={`${p.receivedUnits} received`} />
          <Metric label="Offer savings" value={p.savings} format="currency" />
          <Metric label="Inward freight" value={p.freight} format="currency" caption="from expenses" />
        </MetricStrip>

        <Card>
          <CardHeader title="Items" />
          <div className="scrollbar-thin overflow-x-auto border-t border-border-subtle">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-fg-muted">
                  <th scope="col" className="h-8 pl-4 text-left font-medium">Product</th>
                  <th scope="col" className="px-3 text-right font-medium">Ordered</th>
                  <th scope="col" className="px-3 text-right font-medium">Received</th>
                  <th scope="col" className="px-3 text-right font-medium">Unit cost</th>
                  <th scope="col" className="px-3 text-right font-medium">Line value</th>
                  <th scope="col" className="pr-4 text-right font-medium">Stock now</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((i) => (
                  <tr key={i.productId} className="border-b border-border-subtle last:border-0">
                    <td className="py-2.5 pl-4">
                      <Link href={`/inventory/products/${i.productId}`} className="font-medium hover:underline">
                        {i.name}
                      </Link>
                      <div className="flex items-center gap-2 font-mono text-2xs text-fg-muted">
                        {i.sku}
                        {i.offerTitle && <Badge tone="brass">{i.offerTitle}</Badge>}
                      </div>
                    </td>
                    <td className="num px-3 text-right">{i.quantity}</td>
                    <td className={cn("num px-3 text-right", i.receivedQuantity < i.quantity && "text-warning")}>{i.receivedQuantity}</td>
                    <td className="num px-3 text-right">
                      {formatCurrency(i.unitCost)}
                      {i.listUnitCost > i.unitCost && <div className="text-2xs text-fg-muted line-through">{formatCurrency(i.listUnitCost)}</div>}
                    </td>
                    <td className="num px-3 text-right font-medium">{formatCurrency(i.lineValue)}</td>
                    <td className="num pr-4 text-right">{i.currentStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader title="Goods receipts" description="Stock added to inventory against this order" />
            <CardBody>
              {p.receipts.length === 0 ? (
                <p className="text-sm text-fg-muted">{p.status === "cancelled" ? "Nothing was received — the order was cancelled." : `Nothing received yet. Expected ${formatDate(p.expectedOn)}.`}</p>
              ) : (
                <KeyValue items={p.receipts.map((r) => ({ label: `${formatDate(r.date)} · ${r.productName}`, value: `+${r.quantity}` }))} />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Vendor" />
            <CardBody>
              <KeyValue
                items={[
                  { label: "Contact", value: `${p.vendor.contactPerson} · ${p.vendor.phone}` },
                  { label: "Payment terms", value: `${p.vendor.paymentTermsDays} days` },
                  { label: "Expected", value: formatDate(p.expectedOn) },
                  { label: "Received", value: p.receivedOn ? formatDate(p.receivedOn) : "—" },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </Page>
  );
}
