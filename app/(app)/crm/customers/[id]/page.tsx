import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DebtStatusBadge, LoyaltyTierBadge } from "@/components/business/badges";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart } from "@/components/charts/charts";
import { KeyValue, Metric, MetricStrip } from "@/components/data-display/metrics";
import { TabbedPanel } from "@/components/data-display/tabbed-panel";
import { EmptyState } from "@/components/feedback/states";
import { Page, PageHeader } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar, Meter } from "@/components/ui/misc";
import { customerRepository } from "@/data-access";
import { BillsTable } from "@/features/sales/bills-table";
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/crm/customers/[id]">): Promise<Metadata> {
  const c = await customerRepository.getCustomer((await params).id);
  return { title: c ? (c.businessName ?? c.name) : "Customer" };
}

export default async function CustomerPage({ params }: PageProps<"/crm/customers/[id]">) {
  const c = await customerRepository.getCustomer((await params).id);
  if (!c) notFound();
  const display = c.businessName ?? c.name;
  const open = c.receivables.filter((r) => r.outstanding > 0);

  const overview = (
    <div className="grid gap-4 pt-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Spend by month" />
        <CardBody>
          <ColumnChart data={c.monthly} xKey="month" series={[{ key: "spend", label: "Spend", color: "var(--chart-primary)" }]} height={220} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="What they buy" description="Categories by spend" />
        <CardBody>
          <BarList items={c.topCategories.map((t) => ({ key: t.categoryId, label: t.name, value: t.spend, display: formatCurrencyCompact(t.spend), href: `/inventory/categories/${t.categoryId}` }))} />
        </CardBody>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader title="Favourite products" />
        <ul className="grid divide-y divide-border-subtle border-t border-border-subtle md:grid-cols-2 md:divide-y-0">
          {c.topProducts.map((p) => (
            <li key={p.productId} className="md:border-b md:border-border-subtle">
              <Link href={`/inventory/products/${p.productId}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-hover">
                <span className="truncate text-sm">{p.name}</span>
                <span className="num shrink-0 text-xs text-fg-muted">
                  {p.units} units · {formatCurrencyCompact(p.spend)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );

  const loyalty = (
    <div className="grid gap-4 pt-5 lg:grid-cols-3">
      <Card>
        <CardHeader title="Loyalty program" />
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <LoyaltyTierBadge tier={c.tierName} />
            <span className="text-xs text-fg-muted">based on 12-month spend</span>
          </div>
          {c.nextTier ? (
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-fg-muted">To {c.nextTier.name}</span>
                <span className="font-medium">{formatCurrency(c.nextTier.remaining)} more</span>
              </div>
              <Meter value={c.spend12m} max={c.spend12m + c.nextTier.remaining} label={`Progress to ${c.nextTier.name}`} />
            </div>
          ) : (
            <p className="text-xs text-fg-muted">Top tier reached.</p>
          )}
          <KeyValue
            items={[
              { label: "Points balance", value: formatNumber(c.pointsBalance) },
              { label: "Earned", value: formatNumber(c.pointsEarned) },
              { label: "Redeemed", value: formatNumber(c.pointsRedeemed) },
            ]}
          />
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Points activity" />
        <ul className="scrollbar-thin max-h-80 divide-y divide-border-subtle overflow-y-auto border-t border-border-subtle">
          {c.loyalty.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>
                {e.billId ? <Link href={`/sales/bills/${e.billId}`} className="hover:underline">{e.note}</Link> : e.note}
                <span className="block text-xs text-fg-muted">{formatDate(e.date)}</span>
              </span>
              <span className={cn("num font-medium", e.points > 0 ? "text-success" : "text-fg")}>{e.points > 0 ? `+${e.points}` : e.points}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader title="Coupons used" />
        {c.coupons.length === 0 ? (
          <EmptyState compact title="No coupons used yet" description="Day-specific coupons this customer redeems will appear here." />
        ) : (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {c.coupons.map((u) => (
              <li key={`${u.billId}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Badge tone="primary">{u.code}</Badge> {u.title}
                </span>
                <span className="text-xs text-fg-muted">
                  {formatDate(u.date)} · saved {formatCurrency(u.discount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );

  const debt = (
    <div className="pt-5">
      {c.receivables.length === 0 ? (
        <EmptyState title="No credit history" description="This customer has always paid at the counter." />
      ) : (
        <Card>
          <ul className="divide-y divide-border-subtle">
            {c.receivables.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <Link href={`/sales/bills/${r.billId}`} className="text-sm font-medium hover:underline">
                    {r.billNumber}
                  </Link>
                  <span className="block text-xs text-fg-muted">
                    Issued {formatDate(r.issuedOn)} · due {formatDate(r.dueOn)} · {r.payments.length} payment{r.payments.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="text-right">
                  <span className="num block text-sm font-semibold">{r.outstanding > 0 ? formatCurrency(r.outstanding) : formatCurrency(r.amount)}</span>
                  <span className="text-2xs text-fg-muted">{r.outstanding > 0 ? `of ${formatCurrency(r.amount)}` : "settled"}</span>
                </span>
                <DebtStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );

  return (
    <Page>
      <PageHeader
        back={{ href: "/crm/customers", label: "All customers" }}
        eyebrow={c.type === "business" ? "Business customer" : "Customer"}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={display} tone={c.type === "business" ? "brass" : "primary"} className="size-11 text-sm" />
            {display}
          </span>
        }
        meta={
          <>
            <LoyaltyTierBadge tier={c.tierName} />
            {c.businessName && <span className="text-xs text-fg-muted">Contact: {c.name}</span>}
            <span className="inline-flex items-center gap-1 text-xs text-fg-muted"><Phone className="size-3" />{c.phone}</span>
            {c.email && <span className="inline-flex items-center gap-1 text-xs text-fg-muted"><Mail className="size-3" />{c.email}</span>}
            <span className="inline-flex items-center gap-1 text-xs text-fg-muted"><MapPin className="size-3" />{c.area}, Vadodara</span>
            <span className="text-xs text-fg-muted">Customer since {formatDate(c.joinedOn)}</span>
          </>
        }
      />
      <div className="space-y-5">
        {c.customer.notes && <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-fg-secondary">{c.customer.notes}</p>}
        <MetricStrip columns={5}>
          <Metric label="Spend · 12 months" value={c.spend12m} emphasis />
          <Metric label="Bills" value={c.bills} format="number" caption={`average ${formatCurrency(Math.round(c.avgBill))}`} />
          <Metric label="Days since last purchase" value={c.daysSinceLastPurchase ?? 0} format="number" caption={c.lastPurchaseOn ? formatDate(c.lastPurchaseOn) : "no purchases yet"} />
          <Metric label="Loyalty points" value={c.pointsBalance} format="number" caption={c.tierName} />
          <Metric label="Outstanding" value={c.outstanding} caption={open.length ? `${open.length} open bill${open.length > 1 ? "s" : ""}${c.creditDays ? ` · ${c.creditDays}-day terms` : ""}` : "nothing owed"} href={open.length ? "/sales/collections" : undefined} />
        </MetricStrip>
        <TabbedPanel
          listClassName="px-0"
          panels={[
            { value: "overview", label: "Overview", content: overview },
            { value: "bills", label: "Recent purchases", count: c.recentBills.length, content: <div className="pt-5"><BillsTable bills={c.recentBills} /></div> },
            { value: "loyalty", label: "Loyalty & coupons", content: loyalty },
            { value: "debt", label: "Dues", count: open.length, content: debt },
          ]}
        />
      </div>
    </Page>
  );
}
