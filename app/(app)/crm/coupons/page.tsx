import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { CouponStatusBadge } from "@/components/business/badges";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { crmRepository } from "@/data-access";
import type { CouponView } from "@/data-access/types";
import { formatCurrency, formatCurrencyCompact, formatDate, formatDateShort, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Day-specific coupons" };

const WEEKDAY = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

function scheduleLabel(c: CouponView): string {
  if (c.schedule.kind === "weekly") return `${c.schedule.weekdays.map((d) => WEEKDAY[d]).join(", ")} · ${formatDateShort(c.schedule.from)} – ${formatDateShort(c.schedule.to)}`;
  return c.schedule.dates.length === 1 ? formatDate(c.schedule.dates[0]) : `${c.schedule.dates.length} days · ${formatDateShort(c.windowFrom)} – ${formatDateShort(c.windowTo)}`;
}

function CouponRow({ c }: { c: CouponView }) {
  return (
    <li className="grid gap-3 px-4 py-3.5 md:grid-cols-[1.4fr_1.2fr_1fr_0.9fr] md:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-dashed border-primary/50 bg-primary-soft px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-soft-fg">{c.code}</span>
          <CouponStatusBadge status={c.status} />
        </div>
        <div className="mt-1 text-sm font-medium">{c.title}</div>
        <div className="text-xs text-fg-muted">{c.description}</div>
      </div>
      <div className="text-xs">
        <div className="flex items-center gap-1.5 text-fg">
          <CalendarDays className="size-3.5 text-fg-muted" aria-hidden /> {scheduleLabel(c)}
        </div>
        {c.nextDate && c.status !== "ended" && <div className="mt-0.5 text-fg-muted">Next: {formatDate(c.nextDate)}</div>}
        {c.campaignName && <div className="mt-0.5 text-fg-muted">Campaign: {c.campaignName}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge tone="brass">{c.discountLabel}</Badge>
        <span className="text-fg-muted">min {formatCurrency(c.minBillAmount)}</span>
        <Badge tone="outline">{c.segmentLabel}</Badge>
        {c.categoryNames.length > 0 && <span className="w-full text-fg-muted">On {c.categoryNames.join(", ")}</span>}
      </div>
      <div className="text-xs md:text-right">
        <div className="num text-sm font-semibold">
          {formatNumber(c.uses)} use{c.uses === 1 ? "" : "s"}
          {c.usageLimit ? <span className="font-normal text-fg-muted"> / {c.usageLimit}</span> : null}
        </div>
        <div className="text-fg-muted">
          {formatCurrencyCompact(c.discountGiven)} given · {formatCurrencyCompact(c.billRevenue)} billed
        </div>
      </div>
    </li>
  );
}

export default async function CouponsPage() {
  const coupons = await crmRepository.listCoupons();
  const current = coupons.filter((c) => c.status === "live-today" || c.status === "active" || c.status === "paused");
  const scheduled = coupons.filter((c) => c.status === "scheduled").sort((a, b) => a.windowFrom.localeCompare(b.windowFrom));
  const ended = coupons.filter((c) => c.status === "ended").sort((a, b) => b.windowTo.localeCompare(a.windowTo));
  const list = (items: CouponView[]) => (
    <Card>
      <ul className="divide-y divide-border-subtle">{items.map((c) => <CouponRow key={c.id} c={c} />)}</ul>
    </Card>
  );

  return (
    <Page>
      <PageHeader eyebrow="CRM · offers" title="Day-specific coupons" description="Coupons tied to particular days — festivals, weekdays, events — by customer segment, with their usage and the discount given." />
      <div className="space-y-8">
        <MetricStrip columns={4}>
          <Metric label="Coupons" value={coupons.length} format="number" caption={`${current.length} active · ${scheduled.length} scheduled`} />
          <Metric label="Redemptions · 12 months" value={coupons.reduce((a, c) => a + c.uses, 0)} format="number" />
          <Metric label="Discount given" value={coupons.reduce((a, c) => a + c.discountGiven, 0)} />
          <Metric label="Sales on coupon bills" value={coupons.reduce((a, c) => a + c.billRevenue, 0)} />
        </MetricStrip>
        <Notice tone="info" title="Coupon rules">
          Discounts, minimum bill and segment are recorded per coupon. How coupons combine with loyalty points and offers is an open question.
        </Notice>
        {current.length > 0 && <Section title="Active">{list(current)}</Section>}
        <Section title="Scheduled" description="Coming up — Navratri, Dhanteras and Diwali">
          {list(scheduled)}
        </Section>
        <Section title="Ended">{list(ended)}</Section>
      </div>
    </Page>
  );
}
