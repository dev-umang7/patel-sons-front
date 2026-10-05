import { ArrowRight, FlaskConical, Gift, ShoppingCart, Sparkles, Tags } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DECISION_META, DecisionBadge, MovementBadge } from "@/components/business/badges";
import { ProvenanceTag } from "@/components/business/provenance";
import { Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { inventoryRepository, pricingRepository, purchaseRepository } from "@/data-access";
import type { InventoryDecision } from "@/data-access/types";
import { formatCurrency, formatCurrencyCompact, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Recommendations" };

export default async function RecommendationsPage() {
  const [decisions, opportunities, sourcing] = await Promise.all([inventoryRepository.listDecisions(), pricingRepository.listOpportunities(5), purchaseRepository.listSourcing()]);
  const reorder = sourcing.filter((s) => s.lowStock && s.movement !== "dead" && s.movement !== "slow").sort((a, b) => a.stockOnHand - b.stockOnHand);
  const giftReady = decisions.filter((d) => d.giftable && (d.movement === "slow" || d.movement === "dead") && d.stockOnHand > 0).sort((a, b) => b.stockValue - a.stockValue);
  const actionable = (["review", "replace", "eliminate"] as InventoryDecision[]).map((k) => ({ k, items: decisions.filter((d) => d.recommendation.decision === k) }));

  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence"
        title="Recommendations"
        description="Every simulated suggestion in one place — what to purchase, what to re-price, what to keep, replace or eliminate, and what can go into gift bills."
        meta={<ProvenanceTag kind="simulated" label="All suggestions on this page are simulated" />}
      />
      <div className="space-y-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShoppingCart, label: "Purchase", value: reorder.length, detail: "selling products to re-order", href: "#purchase" },
            { icon: Tags, label: "Re-price", value: opportunities.length, detail: "prices 5%+ away from simulated", href: "/intelligence/pricing" },
            { icon: Sparkles, label: "Decide", value: actionable.reduce((a, x) => a + x.items.length, 0), detail: "to review, replace or eliminate", href: "/inventory/decisions" },
            { icon: Gift, label: "Gift bills", value: giftReady.length, detail: "non-fast items ready for gifting", href: "#gifts" },
          ].map((t) => (
            <Link key={t.label} href={t.href} className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-intel-border">
              <t.icon className="size-4 text-intel" aria-hidden />
              <div className="mt-3 text-2xl font-semibold tracking-tight">{t.value}</div>
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-xs text-fg-muted">{t.detail}</div>
            </Link>
          ))}
        </div>

        <Section id="purchase" title="What should we purchase?" description="At or below re-order level and still selling — with the cheapest live source">
          <Card>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-fg-muted">
                    <th scope="col" className="h-9 pl-4 text-left font-medium">Product</th>
                    <th scope="col" className="px-3 text-right font-medium">Stock</th>
                    <th scope="col" className="px-3 text-left font-medium">Best source</th>
                    <th scope="col" className="px-3 text-right font-medium">Cost</th>
                    <th scope="col" className="px-3 text-right font-medium">vs last paid</th>
                    <th scope="col" className="px-3 text-left font-medium">Offer</th>
                    <th scope="col" className="pr-4 text-right font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {reorder.map((r) => (
                    <tr key={r.productId} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover">
                      <td className="h-11 pl-4">
                        <Link href={`/procurement/sources?product=${r.productId}`} className="font-medium hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="num px-3 text-right text-danger">{r.stockOnHand}</td>
                      <td className="px-3 whitespace-nowrap">{r.bestVendorName}</td>
                      <td className="num px-3 text-right">{formatCurrency(r.bestCost)}</td>
                      <td className={cn("num px-3 text-right", (r.changeVsLastPaidPercent ?? 0) > 0.5 ? "text-danger" : "text-fg-muted")}>{r.changeVsLastPaidPercent === null ? "—" : formatSignedPercent(r.changeVsLastPaidPercent)}</td>
                      <td className="px-3">{r.liveOffers > 0 ? <Badge tone="brass">Live offer</Badge> : "—"}</td>
                      <td className="pr-4 text-right">
                        <Button asChild size="xs" variant="primary">
                          <Link href={`/procurement/orders?new=1&product=${r.productId}`}>Order</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Re-price" description="Largest gaps between today's price and the simulated price">
            <Card>
              <ul className="divide-y divide-border-subtle">
                {opportunities.slice(0, 8).map((o) => (
                  <li key={o.productId}>
                    <Link href={`/intelligence/pricing?product=${o.productId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{o.name}</span>
                        <span className="num text-xs text-fg-muted">
                          {formatCurrency(o.current)} → {formatCurrency(o.recommended)}
                        </span>
                      </span>
                      <MovementBadge movement={o.movement} compact />
                      <span className={cn("num w-16 text-right text-sm font-medium", o.changePercent > 0 ? "text-success" : "text-danger")}>{formatSignedPercent(o.changePercent)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>

          <Section title="Keep, replace or eliminate" description="Products that need a management decision">
            <Card>
              {actionable.map(({ k, items }) => (
                <div key={k} className="border-b border-border-subtle last:border-0">
                  <CardHeader
                    title={
                      <span className="flex items-center gap-2">
                        <DecisionBadge decision={k} /> {items.length} products
                      </span>
                    }
                    description={DECISION_META[k].description}
                    actions={
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/inventory/decisions?decision=${k}`}>
                          Review <ArrowRight />
                        </Link>
                      </Button>
                    }
                    className="pb-3"
                  />
                  <ul className="px-4 pb-3 text-xs text-fg-secondary">
                    {items.slice(0, 3).map((i) => (
                      <li key={i.productId} className="truncate">
                        · {i.name} — {i.recommendation.headline.toLowerCase()}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </Section>
        </div>

        <Section
          id="gifts"
          title="Ready for gift bills"
          description="Giftable non-fast items, by money tied up"
          actions={
            <Button asChild size="sm" variant="primary">
              <Link href={`/intelligence/gift-selection?include=${giftReady.map((g) => g.productId).join(",")}`}>
                <Gift /> Open gift selection
              </Link>
            </Button>
          }
        >
          <Card>
            <ul className="grid divide-y divide-border-subtle md:grid-cols-2 md:divide-y-0">
              {giftReady.map((g) => (
                <li key={g.productId} className="md:border-b md:border-border-subtle">
                  <Link href={`/inventory/products/${g.productId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{g.name}</span>
                      <span className="text-xs text-fg-muted">
                        {g.stockOnHand} units · {g.giftOccasions.join(", ")}
                      </span>
                    </span>
                    <span className="num text-sm font-medium">{formatCurrencyCompact(g.stockValue)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        <Notice tone="intel" icon={FlaskConical} title="Transparency">
          These suggestions are generated by simple, documented rules over the demo data (see the method notes on each tool). None of them comes from a trained AI model, and none is applied without a person accepting it.
        </Notice>
      </div>
    </Page>
  );
}
