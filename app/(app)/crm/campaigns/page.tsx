import type { Metadata } from "next";
import { CouponStatusBadge } from "@/components/business/badges";
import { EmptyState } from "@/components/feedback/states";
import { Page, PageHeader } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { crmRepository } from "@/data-access";
import { formatCurrencyCompact, formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Campaigns" };

const STATUS = { planned: { label: "Planned", tone: "info" }, running: { label: "Running", tone: "success" }, completed: { label: "Completed", tone: "neutral" } } as const;

export default async function CampaignsPage() {
  const campaigns = (await crmRepository.listCampaigns()).sort((a, b) => b.startsOn.localeCompare(a.startsOn));
  return (
    <Page>
      <PageHeader eyebrow="CRM" title="Campaigns" description="Festive and seasonal campaigns, the coupons that ran under them, and what they brought in." />
      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow">{c.occasion}</div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{c.name}</h2>
                <div className="text-xs text-fg-muted">
                  {formatDate(c.startsOn)} – {formatDate(c.endsOn)}
                </div>
              </div>
              <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
            </div>
            <p className="mt-3 text-sm text-fg-secondary">{c.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle text-center">
              {[
                { label: "Coupon uses", value: formatNumber(c.uses) },
                { label: "Sales on those bills", value: formatCurrencyCompact(c.revenue) },
                { label: "Discount given", value: formatCurrencyCompact(c.discountGiven) },
              ].map((s) => (
                <div key={s.label} className="bg-surface px-2 py-2.5">
                  <div className="num text-base font-semibold">{s.value}</div>
                  <div className="text-2xs text-fg-muted">{s.label}</div>
                </div>
              ))}
            </div>
            {c.coupons.length === 0 ? (
              <EmptyState compact title="No coupons attached" description="Link day-specific coupons to this campaign to track them together." />
            ) : (
              <ul className="mt-4 space-y-1.5">
                {c.coupons.map((cp) => (
                  <li key={cp.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{cp.code}</span>
                      <span className="text-fg-muted">{cp.discountLabel}</span>
                    </span>
                    <CouponStatusBadge status={cp.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </Page>
  );
}
