import type { Metadata } from "next";
import Link from "next/link";
import { LoyaltyTierBadge } from "@/components/business/badges";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { crmRepository } from "@/data-access";
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Loyalty program" };

export default async function LoyaltyPage() {
  const l = await crmRepository.getLoyalty();
  const tiers = [...l.tiers].reverse();
  const nearUpgrade = l.members.filter((m) => m.toNextTier !== null && m.toNextTier <= 10_000).sort((a, b) => (a.toNextTier ?? 0) - (b.toNextTier ?? 0));

  return (
    <Page>
      <PageHeader eyebrow="CRM" title="Loyalty program" description="Tiers, points and the customers who are worth the most to the business." />
      <div className="space-y-8">
        <MetricStrip columns={4}>
          <Metric label="Members" value={l.members.length} format="number" caption={`${l.members.filter((m) => m.tierName !== "Member").length} above base tier`} />
          <Metric label="Points earned" value={l.pointsEarned} format="number" caption="last 12 months" />
          <Metric label="Points redeemed" value={l.pointsRedeemed} format="number" caption={`${Math.round((l.pointsRedeemed / Math.max(1, l.pointsEarned)) * 100)}% redemption`} />
          <Metric label="Points outstanding" value={l.pointsOutstanding} format="number" caption="a liability once redemption value is confirmed" />
        </MetricStrip>

        <Notice tone="warning" title="Loyalty rules are assumptions">
          Tier thresholds, the earn rate (1 point per ₹100 in this demo) and redemption value are placeholders — the exact loyalty calculation is an open question for management. Tiers are placed on trailing 12-month spend.
        </Notice>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <LoyaltyTierBadge tier={t.name} />
                <span className="text-xs text-fg-muted">{t.minAnnualSpend > 0 ? `from ${formatCurrencyCompact(t.minAnnualSpend)}/yr` : "everyone"}</span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{t.members}</div>
              <div className="text-xs text-fg-muted">members · {formatCurrencyCompact(t.spend)} spend</div>
              <ul className="mt-3 space-y-1 border-t border-border-subtle pt-3 text-xs text-fg-secondary">
                {t.benefits.map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Section title="Most valuable members" description="By 12-month spend" className="lg:col-span-2">
            <Card>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-fg-muted">
                      <th scope="col" className="h-9 pl-4 text-left font-medium">Member</th>
                      <th scope="col" className="px-3 text-left font-medium">Tier</th>
                      <th scope="col" className="px-3 text-right font-medium">Spend · 12m</th>
                      <th scope="col" className="px-3 text-right font-medium">Points</th>
                      <th scope="col" className="pr-4 text-left font-medium">Progress to next tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.members.slice(0, 15).map((m) => (
                      <tr key={m.customerId} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover">
                        <td className="h-11 pl-4">
                          <Link href={`/crm/customers/${m.customerId}`} className="font-medium hover:underline">
                            {m.name}
                          </Link>
                        </td>
                        <td className="px-3">
                          <LoyaltyTierBadge tier={m.tierName} />
                        </td>
                        <td className="num px-3 text-right">{formatCurrency(m.spend12m)}</td>
                        <td className="num px-3 text-right">{formatNumber(m.pointsBalance)}</td>
                        <td className="pr-4">
                          {m.nextTierName ? (
                            <div className="flex items-center gap-2">
                              <Meter value={m.spend12m} max={m.spend12m + (m.toNextTier ?? 0)} label={`Progress to ${m.nextTierName}`} className="w-20" />
                              <span className="text-xs whitespace-nowrap text-fg-muted">
                                {formatCurrencyCompact(m.toNextTier ?? 0)} to {m.nextTierName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-fg-muted">Top tier</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
          <div className="space-y-8">
            <Section title="Close to an upgrade" description="Within ₹10K of the next tier — worth a nudge">
              <Card>
                <ul className="divide-y divide-border-subtle">
                  {nearUpgrade.slice(0, 6).map((m) => (
                    <li key={m.customerId}>
                      <Link href={`/crm/customers/${m.customerId}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-hover">
                        <span className="truncate text-sm">{m.name}</span>
                        <span className="shrink-0 text-xs text-fg-muted">
                          {formatCurrencyCompact(m.toNextTier ?? 0)} → {m.nextTierName}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </Section>
            <Section title="Recent points activity">
              <Card>
                <ul className="divide-y divide-border-subtle">
                  {l.recent.slice(0, 8).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate">{e.customerName}</span>
                        <span className="text-xs text-fg-muted">{formatDate(e.date)}</span>
                      </span>
                      <span className={cn("num font-medium", e.points > 0 ? "text-success" : "text-fg")}>{e.points > 0 ? `+${e.points}` : e.points}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Section>
          </div>
        </div>
      </div>
    </Page>
  );
}
