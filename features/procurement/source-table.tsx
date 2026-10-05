import { Clock, Crown, Tag } from "lucide-react";
import Link from "next/link";
import { OfferStatusBadge } from "@/components/business/badges";
import { Badge } from "@/components/ui/badge";
import type { SourceOption } from "@/data-access/types";
import { formatCurrency, formatDateShort, formatPercent, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const VERDICT: Record<SourceOption["verdict"], { label: string; tone: "success" | "info" | "neutral" | "warning" }> = {
  "best-value": { label: "Best value", tone: "success" },
  competitive: { label: "Competitive", tone: "info" },
  costlier: { label: "Costlier", tone: "neutral" },
  "quote-expired": { label: "Quote expired", tone: "warning" },
};

/** PriceComparisonTable — one row per source, ranked by effective cost. */
export function PriceComparisonTable({ options, sellingPrice }: { options: SourceOption[]; sellingPrice: number }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[880px] text-sm">
        <caption className="sr-only">Sources ranked by effective purchase cost</caption>
        <thead>
          <tr className="border-b border-border text-xs text-fg-muted">
            <th scope="col" className="h-9 pl-4 text-left font-medium">Source</th>
            <th scope="col" className="px-3 text-right font-medium">Quoted</th>
            <th scope="col" className="px-3 text-left font-medium">Offer</th>
            <th scope="col" className="px-3 text-right font-medium">Effective cost</th>
            <th scope="col" className="px-3 text-right font-medium">vs best</th>
            <th scope="col" className="px-3 text-right font-medium">Margin at {formatCurrency(sellingPrice)}</th>
            <th scope="col" className="px-3 text-right font-medium">Last paid</th>
            <th scope="col" className="px-3 text-right font-medium">Min qty · lead</th>
            <th scope="col" className="px-3 text-right font-medium">On time</th>
            <th scope="col" className="pr-4 text-right font-medium">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {options.map((o) => {
            const v = VERDICT[o.verdict];
            const change = o.lastPaidCost ? ((o.effectiveCost - o.lastPaidCost) / o.lastPaidCost) * 100 : null;
            return (
              <tr key={o.quoteId} className={cn("border-b border-border-subtle last:border-0", o.verdict === "best-value" && "bg-success-soft/40", o.quoteExpired && "text-fg-muted")}>
                <td className="py-2.5 pl-4">
                  <div className="flex items-center gap-2">
                    {o.verdict === "best-value" && <Crown className="size-3.5 text-success" aria-label="Best value" />}
                    <Link href={`/procurement/vendors/${o.vendorId}`} className="font-medium text-fg hover:underline">
                      {o.vendorName}
                    </Link>
                  </div>
                  <div className="text-2xs text-fg-muted capitalize">
                    {o.vendorType.replace("-", " ")} · {o.city} · quoted {formatDateShort(o.quotedOn)}
                    {o.quoteExpired && <span className="text-warning"> · expired {formatDateShort(o.validUntil)}</span>}
                  </div>
                </td>
                <td className="num px-3 text-right">{formatCurrency(o.quotedCost)}</td>
                <td className="px-3">
                  {o.offer ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 text-xs text-fg">
                        <Tag className="size-3 text-brass" aria-hidden /> {o.offer.benefitLabel}
                        {o.offer.minQty ? <span className="text-fg-muted">· min {o.offer.minQty}</span> : null}
                      </span>
                      <OfferStatusBadge status={o.offer.status} />
                    </div>
                  ) : (
                    <span className="text-xs text-fg-subtle">—</span>
                  )}
                </td>
                <td className="num px-3 text-right font-semibold">{formatCurrency(o.effectiveCost)}</td>
                <td className={cn("num px-3 text-right", o.diffVsBestPercent > 0.05 ? "text-fg-secondary" : "text-success")}>{o.diffVsBestPercent < 0.05 ? "—" : formatSignedPercent(o.diffVsBestPercent)}</td>
                <td className="num px-3 text-right">{formatPercent(o.expectedMarginPercent)}</td>
                <td className="num px-3 text-right">
                  {o.lastPaidCost === null ? (
                    <span className="text-fg-subtle">—</span>
                  ) : (
                    <>
                      <div>{formatCurrency(o.lastPaidCost)}</div>
                      {change !== null && Math.abs(change) >= 0.5 && <div className={cn("text-2xs", change > 0 ? "text-danger" : "text-success")}>{formatSignedPercent(change)} now</div>}
                    </>
                  )}
                </td>
                <td className="num px-3 text-right text-xs">
                  {o.minOrderQty} units
                  <div className="inline-flex items-center gap-0.5 text-fg-muted">
                    <Clock className="size-3" aria-hidden /> {o.leadTimeDays} d
                  </div>
                </td>
                <td className="num px-3 text-right text-xs">{o.onTimeRate === null ? "—" : formatPercent(o.onTimeRate, 0)}</td>
                <td className="pr-4 text-right">
                  <Badge tone={v.tone}>{v.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
