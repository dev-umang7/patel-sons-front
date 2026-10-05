import { CalendarClock, Sparkles, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MovementBadge, OfferStatusBadge } from "@/components/business/badges";
import { EmptyState, Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { vendorRepository } from "@/data-access";
import type { VendorOfferView } from "@/data-access/types";
import { ProcurementLifecycle } from "@/features/procurement/lifecycle";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Vendor offers" };

const TYPE_LABEL: Record<VendorOfferView["type"], string> = { festive: "Festive offer", volume: "Volume slab", scheme: "Trade scheme", clearance: "Clearance", launch: "Launch price" };

function OfferCard({ o }: { o: VendorOfferView }) {
  return (
    <Card id={o.id} className="scroll-mt-24 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={o.type === "festive" ? "brass" : "outline"}>{TYPE_LABEL[o.type]}</Badge>
            {o.festival && <span className="text-2xs text-fg-muted">{o.festival}</span>}
          </div>
          <h3 className="mt-2 font-semibold tracking-tight">{o.title}</h3>
          <Link href={`/procurement/vendors/${o.vendorId}`} className="text-xs text-fg-muted hover:text-fg hover:underline">
            {o.vendorName}
          </Link>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <OfferStatusBadge status={o.status} />
          <span className="text-2xs text-fg-muted">{o.status === "upcoming" ? `starts in ${o.daysToStart} days` : o.status === "expired" ? `ended ${formatDate(o.endsOn)}` : `${o.daysLeft} days left`}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Tag className="size-3.5 text-brass" aria-hidden /> {o.benefitLabel}
        </span>
        {o.minQty && <span className="text-xs text-fg-muted">minimum {o.minQty} units</span>}
        <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
          <CalendarClock className="size-3" aria-hidden /> {formatDate(o.startsOn)} – {formatDate(o.endsOn)}
        </span>
      </div>
      <p className="mt-2 text-xs text-fg-secondary">{o.description}</p>
      {o.terms && <p className="mt-1 text-2xs text-fg-muted">Terms: {o.terms}</p>}
      <ul className="mt-3 divide-y divide-border-subtle rounded-md border border-border-subtle">
        {o.products.map((p) => (
          <li key={p.productId}>
            <Link href={`/procurement/sources?product=${p.productId}`} className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-surface-hover">
              <span className="truncate">{p.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-fg-muted">
                {p.stockOnHand} in stock <MovementBadge movement={p.movement} compact />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {o.usedOnPurchases > 0 && <p className="mt-2 text-2xs text-fg-muted">Used on {o.usedOnPurchases} purchase{o.usedOnPurchases > 1 ? "s" : ""}.</p>}
    </Card>
  );
}

export default async function OffersPage() {
  const offers = await vendorRepository.listOffers();
  const live = offers.filter((o) => o.status === "active" || o.status === "expiring").sort((a, b) => a.endsOn.localeCompare(b.endsOn));
  const upcoming = offers.filter((o) => o.status === "upcoming").sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  const expired = offers.filter((o) => o.status === "expired").sort((a, b) => b.endsOn.localeCompare(a.endsOn));
  const grid = (list: VendorOfferView[], empty: string) => (list.length === 0 ? <EmptyState compact title="Nothing here" description={empty} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((o) => <OfferCard key={o.id} o={o} />)}</div>);

  return (
    <Page>
      <PageHeader eyebrow="Procurement" title="Festive & vendor offers" description="Offers from brands and vendors on purchases — what is live, what is coming for the festive season, and what has lapsed." meta={<ProcurementLifecycle current="discover" />} />
      <div className="space-y-10">
        <Notice tone="info" icon={Sparkles} title="How offers are applied">
          Price comparison applies a live offer to that vendor&apos;s quoted cost, assuming the minimum quantity is met. How offers stack with each other and with volume terms is an open question to confirm with vendors.
        </Notice>
        <Section title="Live now" description="Order before these end">
          {grid(live, "No vendor offers are live today.")}
        </Section>
        <Section title="Coming up" description="Plan purchases around these">
          {grid(upcoming, "No offers announced yet.")}
        </Section>
        <Section title="Expired" description="For reference — prices paid under these are in purchase history">
          {grid(expired, "No past offers.")}
        </Section>
      </div>
    </Page>
  );
}
