import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { OfferStatusBadge, PurchaseStatusBadge } from "@/components/business/badges";
import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { DashboardData } from "@/data-access/types";
import { formatCurrency, formatCurrencyCompact, formatDateShort, formatPercent, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProcurementSection({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Open purchase orders" description="Draft, ordered and partly received" actions={<Button asChild variant="ghost" size="sm"><Link href="/procurement/orders">All orders</Link></Button>} />
        {data.openOrders.length === 0 ? (
          <EmptyState compact title="No open orders" description="Everything ordered has been received." />
        ) : (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {data.openOrders.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link href={`/procurement/purchases/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{p.vendorName}</span>
                    <span className="text-xs text-fg-muted">
                      {p.number} · {p.status === "draft" ? "not yet sent" : `expected ${formatDateShort(p.expectedOn)}`}
                      {p.isLate && <span className="text-danger"> · {p.daysLate}d late</span>}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="num text-sm font-medium">{formatCurrencyCompact(p.value)}</span>
                    <PurchaseStatusBadge status={p.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Festive & vendor offers" description="Live now or starting within two weeks" actions={<Button asChild variant="ghost" size="sm"><Link href="/procurement/offers">All offers</Link></Button>} />
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {data.liveOffers.slice(0, 6).map((o) => (
            <li key={o.id}>
              <Link href={`/procurement/offers#${o.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{o.title}</span>
                  <span className="text-xs text-fg-muted">
                    {o.vendorName} · {o.benefitLabel}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <OfferStatusBadge status={o.status} />
                  <span className="text-2xs text-fg-muted">{o.status === "upcoming" ? `starts in ${o.daysToStart}d` : `${o.daysLeft}d left`}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Purchase price changes" description="Last vendor's cost, now vs six months ago" />
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {data.priceChanges.map((c) => (
            <li key={c.productId}>
              <Link href={`/procurement/sources?product=${c.productId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{c.name}</span>
                  <span className="text-xs text-fg-muted">
                    {c.vendorName} · {formatCurrency(c.from)} → {formatCurrency(c.to)}
                  </span>
                </span>
                <span className={cn("num inline-flex items-center gap-0.5 text-sm font-medium", c.changePercent > 0 ? "text-danger" : "text-success")}>
                  {c.changePercent > 0 && <ArrowUpRight className="size-3.5" aria-hidden />}
                  {formatSignedPercent(c.changePercent)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader title="Vendor performance" description="Largest vendors by value received over the last 12 months" actions={<Button asChild variant="ghost" size="sm"><Link href="/procurement/vendors">All vendors</Link></Button>} />
        <div className="scrollbar-thin overflow-x-auto border-t border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs text-fg-muted">
                <th scope="col" className="h-8 px-4 text-left font-medium">Vendor</th>
                <th scope="col" className="px-3 text-right font-medium">Purchased</th>
                <th scope="col" className="px-3 text-right font-medium">Orders</th>
                <th scope="col" className="px-3 text-right font-medium">On time</th>
                <th scope="col" className="px-3 text-right font-medium">Avg delay</th>
                <th scope="col" className="px-3 text-right font-medium">Cheapest source on</th>
                <th scope="col" className="px-4 text-right font-medium">Open orders</th>
              </tr>
            </thead>
            <tbody>
              {data.vendorPerformance.map((v) => (
                <tr key={v.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover">
                  <td className="h-10 px-4">
                    <Link href={`/procurement/vendors/${v.id}`} className="font-medium text-fg hover:underline">
                      {v.name}
                    </Link>
                    <span className="ml-2 text-xs text-fg-muted">{v.city}</span>
                  </td>
                  <td className="num px-3 text-right">{formatCurrencyCompact(v.purchaseValue)}</td>
                  <td className="num px-3 text-right">{v.purchaseCount}</td>
                  <td className="num px-3 text-right">{v.onTimeRate === null ? "—" : formatPercent(v.onTimeRate, 0)}</td>
                  <td className="num px-3 text-right">{v.avgDelayDays === null ? "—" : `${v.avgDelayDays.toFixed(1)} d`}</td>
                  <td className="num px-3 text-right">{formatPercent(v.bestPriceShare, 0)} of quotes</td>
                  <td className="num px-4 text-right">{v.openOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
