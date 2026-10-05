import Link from "next/link";
import { ActivityTimeline } from "@/components/business/activity-timeline";
import { MovementBadge, OfferStatusBadge } from "@/components/business/badges";
import { PriceRecommendationPanel } from "@/components/business/price-recommendation";
import { ProvenanceTag } from "@/components/business/provenance";
import { RecommendationCard } from "@/components/business/recommendation-card";
import { ColumnChart, MultiLineChart } from "@/components/charts/charts";
import { SERIES } from "@/components/charts/palette";
import { KeyValue } from "@/components/data-display/metrics";
import { TabbedPanel } from "@/components/data-display/tabbed-panel";
import { EmptyState, Notice } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import type { ProductDetail } from "@/data-access/types";
import { PriceComparisonTable } from "@/features/procurement/source-table";
import { formatCurrency, formatCurrencyCompact, formatDate, formatDays, formatNumber, formatPercent, formatRelativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DecisionActions } from "./decision-actions";

const MOVE_LABEL = { opening: "Opening stock", purchase: "Received", sale: "Sold", adjustment: "Adjustment" } as const;

export function ProductTabs({ detail, asOf }: { detail: ProductDetail; asOf: string }) {
  const { item, product, sourcing } = detail;
  const coverPct = item.daysOfCover === null ? 100 : Math.min(100, (item.daysOfCover / 180) * 100);

  const overview = (
    <div className="grid gap-4 pt-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader title="Sales over 12 months" description={`${formatNumber(detail.unitsSold12m)} units · ${formatCurrencyCompact(detail.revenue12m)} sales · ${formatCurrencyCompact(detail.grossProfit12m)} gross profit`} />
          <CardBody>
            <ColumnChart data={detail.salesMonthly} xKey="month" series={[{ key: "units", label: "Units sold", color: "var(--chart-primary)" }]} format="number" height={200} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Product details" actions={<ProvenanceTag kind="recorded" />} />
          <CardBody>
            <p className="mb-3 text-sm text-fg-secondary">{product.description}</p>
            <KeyValue
              columns={2}
              items={[
                ...Object.entries(product.attributes).map(([label, value]) => ({ label, value })),
                { label: "MRP", value: formatCurrency(product.mrp) },
                { label: "HSN · GST", value: `${product.hsn} · ${product.gstRate}%` },
                { label: "Unit", value: product.unit },
                { label: "Gift occasions", value: product.giftOccasions.length ? product.giftOccasions.join(", ") : "Not tagged for gifting" },
              ]}
            />
          </CardBody>
        </Card>
      </div>
      <div className="space-y-4">
        <RecommendationCard
          recommendation={detail.decision}
          actions={<DecisionActions productId={item.productId} productName={item.name} actions={detail.decision.actions} replacement={detail.decision.replacement} asOf={asOf} size="xs" />}
        />
        <Card>
          <CardHeader title="Price check" actions={<ProvenanceTag kind="simulated" />} />
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-fg-muted">Recommended sell</span><span className="num font-semibold">{formatCurrency(detail.pricing.sell.recommended)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Target buy</span><span className="num font-semibold">{formatCurrency(detail.pricing.buy.target)}</span></div>
            <Button asChild size="sm" variant="intel" className="mt-2 w-full">
              <Link href={`/intelligence/pricing?product=${item.productId}`}>Open price composition</Link>
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  const inventory = (
    <div className="grid gap-4 pt-5 lg:grid-cols-3">
      <Card>
        <CardHeader title="Stock position" actions={<ProvenanceTag kind="calculated" />} />
        <CardBody className="space-y-4">
          <KeyValue
            items={[
              { label: "On hand", value: `${formatNumber(item.stockOnHand)} units` },
              { label: "On order", value: `${formatNumber(item.onOrder)} units` },
              { label: "Re-order level", value: `${item.reorderLevel} units` },
              { label: "Stock value (avg cost)", value: formatCurrency(item.stockValue) },
              { label: "Retail value", value: formatCurrency(item.retailValue) },
              { label: "Sold in last 30 / 90 days", value: `${item.unitsSold30} / ${item.unitsSold90}` },
              { label: "Average stock age", value: item.avgStockAgeDays === null ? "—" : formatDays(item.avgStockAgeDays) },
              { label: "Oldest stock received", value: item.oldestStockOn ? formatDate(item.oldestStockOn) : "—" },
              { label: "Last sale", value: item.lastSaleOn ? `${formatDate(item.lastSaleOn)} (${formatRelativeDays(item.daysSinceLastSale!)})` : "No sale in 12 months" },
            ]}
          />
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-fg-muted">Days of cover</span>
              <span className="num font-medium">{item.daysOfCover === null ? "No recent sales" : `${Math.round(item.daysOfCover)} days`}</span>
            </div>
            <Meter value={coverPct} label="Days of cover relative to 180 days" tone={item.movement === "dead" ? "danger" : item.movement === "slow" ? "warning" : "success"} />
          </div>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Stock ledger" description="Every receipt, sale and adjustment — newest first" />
        <div className="scrollbar-thin max-h-[480px] overflow-auto border-t border-border-subtle">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border-subtle text-xs text-fg-muted">
                <th scope="col" className="h-8 pl-4 text-left font-medium">Date</th>
                <th scope="col" className="px-3 text-left font-medium">Movement</th>
                <th scope="col" className="px-3 text-left font-medium">Reference</th>
                <th scope="col" className="px-3 text-right font-medium">Qty</th>
                <th scope="col" className="pr-4 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {detail.ledger.map((m) => (
                <tr key={m.id} className="border-b border-border-subtle last:border-0">
                  <td className="h-9 pl-4 whitespace-nowrap text-fg-secondary">{formatDate(m.date)}</td>
                  <td className="px-3">{MOVE_LABEL[m.type]}</td>
                  <td className="px-3 text-xs">
                    {m.reference.kind === "bill" ? <Link className="hover:underline" href={`/sales/bills/${m.reference.id}`}>{m.reference.label}</Link> : m.reference.kind === "purchase" ? <Link className="hover:underline" href={`/procurement/purchases/${m.reference.id}`}>{m.reference.label}</Link> : <span className="text-fg-muted">{m.reference.label}</span>}
                  </td>
                  <td className={cn("num px-3 text-right font-medium", m.quantity > 0 ? "text-success" : "text-fg")}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td className="num pr-4 text-right">{m.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const pricing = (
    <div className="grid gap-4 pt-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PriceRecommendationPanel rec={detail.pricing} />
      </div>
      <Card>
        <CardHeader title="Selling price history" actions={<ProvenanceTag kind="recorded" />} />
        <ol className="divide-y divide-border-subtle border-t border-border-subtle">
          {[...detail.priceHistory].reverse().map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span>
                <span className="block text-sm">{formatDate(r.effectiveFrom)}</span>
                <span className="text-xs text-fg-muted">{r.note}</span>
              </span>
              <span className="text-right">
                <span className="num block text-sm font-medium">{formatCurrency(r.sellingPrice)}</span>
                <span className="num text-2xs text-fg-muted">MRP {formatCurrency(r.mrp)}</span>
              </span>
            </li>
          ))}
        </ol>
        <CardBody className="border-t border-border-subtle pt-3">
          <KeyValue
            items={[
              { label: "Average stock cost", value: formatCurrency(item.avgUnitCost) },
              { label: "Last purchase cost", value: item.lastPurchaseCost === null ? "—" : formatCurrency(item.lastPurchaseCost) },
              { label: "Current margin", value: <span className={cn(item.lowMargin && "text-warning")}>{formatPercent(item.marginPercent)}</span> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );

  const vendorSeries = sourcing.vendorsInHistory.slice(0, 8).map((v, i) => ({ key: v.id, label: v.name, color: SERIES[i] }));
  const procurement = (
    <div className="space-y-4 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Source comparison</h3>
          <p className="text-xs text-fg-muted">Ranked by effective cost after live offers. Expired quotes sink to the bottom.</p>
        </div>
        <Button asChild size="sm">
          <Link href={`/procurement/sources?product=${item.productId}`}>Open in price comparison</Link>
        </Button>
      </div>
      <PriceComparisonTable options={sourcing.options} sellingPrice={item.sellingPrice} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Vendor price history" description="Monthly quoted cost per vendor" />
          <CardBody>
            <MultiLineChart data={sourcing.costHistory} xKey="month" series={vendorSeries} height={220} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Previous purchases" description={`${sourcing.purchaseHistory.length} receipts in 12 months`} />
          {sourcing.purchaseHistory.length === 0 ? (
            <EmptyState compact title="No purchases in the last 12 months" description="This product has been sold from opening stock only." />
          ) : (
            <ul className="scrollbar-thin max-h-[260px] divide-y divide-border-subtle overflow-y-auto border-t border-border-subtle">
              {sourcing.purchaseHistory.map((p) => (
                <li key={`${p.purchaseId}-${p.date}`}>
                  <Link href={`/procurement/purchases/${p.purchaseId}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-hover">
                    <span>
                      <span className="block text-sm">{p.vendorName}</span>
                      <span className="text-xs text-fg-muted">{p.number} · {formatDate(p.date)}</span>
                    </span>
                    <span className="text-right">
                      <span className="num block text-sm font-medium">{formatCurrency(p.unitCost)}</span>
                      <span className="num text-2xs text-fg-muted">{p.quantity} units</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {detail.offers.length > 0 && (
        <Card>
          <CardHeader title="Vendor offers on this product" />
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {detail.offers.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span>
                  <span className="block text-sm">{o.title}</span>
                  <span className="text-xs text-fg-muted">{o.vendorName} · {o.benefitLabel} · {formatDate(o.startsOn)} – {formatDate(o.endsOn)}</span>
                </span>
                <OfferStatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );

  const sales = (
    <div className="grid gap-4 pt-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Monthly sales and gross profit" />
        <CardBody>
          <ColumnChart
            data={detail.salesMonthly}
            xKey="month"
            series={[
              { key: "revenue", label: "Sales", color: "var(--chart-1)" },
              { key: "grossProfit", label: "Gross profit", color: "var(--chart-3)" },
            ]}
            height={240}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Customer demand" description={`${formatPercent(detail.walkInShare, 0)} of units went to walk-in customers`} />
        {detail.topCustomers.length === 0 ? (
          <EmptyState compact title="No registered buyers" description="All sales in the last 12 months were to walk-in customers." />
        ) : (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {detail.topCustomers.map((c) => (
              <li key={c.customerId}>
                <Link href={`/crm/customers/${c.customerId}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-hover">
                  <span className="truncate text-sm">{c.name}</span>
                  <span className="num shrink-0 text-xs text-fg-muted">{c.units} units · {formatCurrencyCompact(c.revenue)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );

  return (
    <TabbedPanel
      listClassName="px-0"
      panels={[
        { value: "overview", label: "Overview", content: overview },
        { value: "inventory", label: "Inventory", content: inventory },
        { value: "pricing", label: "Pricing", content: pricing },
        { value: "procurement", label: "Procurement", count: sourcing.options.length, content: procurement },
        { value: "sales", label: "Sales", content: sales },
        { value: "activity", label: "Activity", content: <div className="max-w-2xl pt-5"><ActivityTimeline events={detail.activity} /></div> },
      ]}
    />
  );
}

export function ProductMovementNotice({ detail }: { detail: ProductDetail }) {
  if (detail.item.movement !== "slow" && detail.item.movement !== "dead") return null;
  return (
    <Notice tone="warning" title={<>This product is <MovementBadge movement={detail.item.movement} /></>}>
      {formatCurrency(detail.item.stockValue)} is tied up in {detail.item.stockOnHand} units. See the recommended action below, or review all non-fast items on the{" "}
      <Link href="/inventory/slow-moving" className="font-medium underline">
        slow-moving page
      </Link>
      .
    </Notice>
  );
}
