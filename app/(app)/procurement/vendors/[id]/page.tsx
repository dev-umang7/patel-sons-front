import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MovementBadge, OfferStatusBadge } from "@/components/business/badges";
import { ColumnChart } from "@/components/charts/charts";
import { KeyValue, Metric, MetricStrip } from "@/components/data-display/metrics";
import { TabbedPanel } from "@/components/data-display/tabbed-panel";
import { EmptyState } from "@/components/feedback/states";
import { Page, PageHeader } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { vendorRepository } from "@/data-access";
import { PurchasesTable } from "@/features/procurement/purchases-table";
import { formatCurrency, formatDate, formatPercent, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/procurement/vendors/[id]">): Promise<Metadata> {
  const v = await vendorRepository.getVendor((await params).id);
  return { title: v?.name ?? "Vendor" };
}

export default async function VendorPage({ params }: PageProps<"/procurement/vendors/[id]">) {
  const v = await vendorRepository.getVendor((await params).id);
  if (!v) notFound();

  const productsPanel = (
    <Card className="mt-5">
      <ul className="divide-y divide-border-subtle">
        {v.products
          .sort((a, b) => Number(b.isBest) - Number(a.isBest) || a.diffVsBestPercent - b.diffVsBestPercent)
          .map((p) => (
            <li key={p.productId}>
              <Link href={`/procurement/sources?product=${p.productId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{p.name}</span>
                  <span className="font-mono text-2xs text-fg-muted">{p.sku}</span>
                </span>
                <MovementBadge movement={p.movement} compact />
                <span className="w-24 text-right">
                  <span className="num block text-sm font-medium">{formatCurrency(p.quotedCost)}</span>
                  <span className={cn("text-2xs", p.isBest ? "text-success" : "text-fg-muted")}>{p.isBest ? "cheapest source" : `${formatSignedPercent(p.diffVsBestPercent)} vs best`}</span>
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </Card>
  );

  const offersPanel =
    v.offers.length === 0 ? (
      <EmptyState title="No offers from this vendor" description="Festive offers and schemes from this vendor will appear here." />
    ) : (
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {v.offers.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{o.title}</div>
                <div className="text-xs text-fg-muted">
                  {o.benefitLabel}
                  {o.minQty ? ` · min ${o.minQty} units` : ""} · {formatDate(o.startsOn)} – {formatDate(o.endsOn)}
                </div>
              </div>
              <OfferStatusBadge status={o.status} />
            </div>
            <p className="mt-2 text-xs text-fg-secondary">{o.description}</p>
          </Card>
        ))}
      </div>
    );

  return (
    <Page>
      <PageHeader
        back={{ href: "/procurement/vendors", label: "All vendors" }}
        eyebrow={`${v.type.replace("-", " ")} · ${v.city}, ${v.state}`}
        title={v.name}
        meta={
          <>
            {v.brandNames.map((b) => (
              <Badge key={b} tone="outline">
                {b}
              </Badge>
            ))}
          </>
        }
      />
      <div className="space-y-6">
        <MetricStrip columns={5}>
          <Metric label="Purchased · 12 months" value={v.purchaseValue} caption={`${v.purchaseCount} purchases`} emphasis />
          <Metric label="On-time delivery" value={v.onTimeRate ?? 0} format="percent" caption={v.avgDelayDays !== null ? `avg delay ${v.avgDelayDays.toFixed(1)} days` : undefined} />
          <Metric label="Fill rate" value={v.fillRate ?? 0} format="percent" caption="received ÷ ordered" />
          <Metric label="Cheapest source on" value={v.bestPriceShare} format="percent" caption={`of ${v.productCount} products quoted`} />
          <Metric label="Open orders" value={v.openOrders} format="number" caption={`${v.liveOffers} live offers`} />
        </MetricStrip>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Purchases by month" />
            <CardBody>
              <ColumnChart data={v.monthly} xKey="month" series={[{ key: "value", label: "Purchased", color: "var(--chart-2)" }]} height={220} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Contact & terms" />
            <CardBody>
              <KeyValue
                items={[
                  { label: "Contact", value: v.contactPerson },
                  { label: "Phone", value: <a className="inline-flex items-center gap-1 hover:underline" href={`tel:${v.phone.replace(/\s/g, "")}`}><Phone className="size-3" />{v.phone}</a> },
                  { label: "Email", value: <a className="inline-flex items-center gap-1 hover:underline" href={`mailto:${v.email}`}><Mail className="size-3" />{v.email}</a> },
                  { label: "GSTIN", value: <span className="font-mono text-xs">{v.gstin}</span> },
                  { label: "Payment terms", value: `${v.paymentTermsDays} days` },
                  { label: "Lead time", value: `${v.leadTimeDays} days` },
                  { label: "Vendor since", value: formatDate(v.since) },
                  { label: "Categories", value: v.categoryNames.join(", ") },
                ]}
              />
            </CardBody>
          </Card>
        </div>
        <TabbedPanel
          listClassName="px-0"
          panels={[
            { value: "products", label: "Products & prices", count: v.products.length, content: productsPanel },
            { value: "purchases", label: "Purchase history", count: v.purchases.length, content: <div className="mt-5"><PurchasesTable purchases={v.purchases} mode="history" /></div> },
            { value: "offers", label: "Offers", count: v.offers.length, content: offersPanel },
          ]}
        />
        <p className="text-2xs text-fg-muted">On-time rate and fill rate use completed orders only ({formatPercent(v.onTimeRate ?? 0, 0)} on time across {v.purchaseCount} purchases).</p>
      </div>
    </Page>
  );
}
