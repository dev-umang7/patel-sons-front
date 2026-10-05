import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { PriceRecommendation, PricingFactorEffect } from "@/data-access/types";
import { formatCurrency, formatPercent, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConfidenceIndicator } from "./badges";
import { ProvenanceTag } from "./provenance";

const EFFECT: Record<PricingFactorEffect, { icon: typeof Minus; className: string; label: string }> = {
  raise: { icon: ArrowUpRight, className: "text-success", label: "Pushes price up" },
  lower: { icon: ArrowDownRight, className: "text-danger", label: "Pushes price down" },
  neutral: { icon: Minus, className: "text-fg-subtle", label: "Neutral" },
};

/** Sale & purchase price composition (simulated), with every factor visible. */
export function PriceRecommendationPanel({ rec, compact }: { rec: PriceRecommendation; compact?: boolean }) {
  const s = rec.sell;
  const b = rec.buy;
  return (
    <div className="space-y-4">
      <div className="grid gap-px overflow-hidden rounded-lg border border-intel-border bg-intel-border sm:grid-cols-2">
        <div className="bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow">Sell for · what should it sell for?</span>
            <ProvenanceTag kind="simulated" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[30px] leading-none font-semibold tracking-tight">{formatCurrency(s.recommended)}</span>
            <span className={cn("text-xs font-medium", s.changePercent > 0.5 ? "text-success" : s.changePercent < -0.5 ? "text-danger" : "text-fg-muted")}>
              {Math.abs(s.changePercent) < 0.5 ? "no change" : `${formatSignedPercent(s.changePercent)} vs today`}
            </span>
          </div>
          <div className="mt-1 text-xs text-fg-muted">
            Range {formatCurrency(s.low)} – {formatCurrency(s.high)} · currently {formatCurrency(s.current)} · MRP {formatCurrency(s.mrp)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              Expected margin <span className="font-semibold">{formatPercent(s.expectedMarginPercent)}</span>
              <span className="text-fg-muted"> (now {formatPercent(s.currentMarginPercent)})</span>
            </span>
            <ConfidenceIndicator confidence={s.confidence} />
          </div>
          {!compact && <p className="mt-3 text-xs leading-relaxed text-fg-secondary">{s.rationale}</p>}
        </div>
        <div className="bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow">Pay up to · what should we pay?</span>
            <ProvenanceTag kind="simulated" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[30px] leading-none font-semibold tracking-tight">{formatCurrency(b.target)}</span>
            <span className="text-xs text-fg-muted">target cost</span>
          </div>
          <div className="mt-1 text-xs text-fg-muted">
            Walk away above {formatCurrency(b.walkAway)}
            {b.bestAvailable !== null && ` · best live source ${formatCurrency(b.bestAvailable)} (${b.bestVendorName})`}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              Last paid <span className="font-semibold">{b.lastPaid === null ? "—" : formatCurrency(b.lastPaid)}</span>
              {b.avgPaid !== null && <span className="text-fg-muted"> · avg {formatCurrency(b.avgPaid)}</span>}
            </span>
            <ConfidenceIndicator confidence={b.confidence} />
          </div>
          {!compact && <p className="mt-3 text-xs leading-relaxed text-fg-secondary">{b.rationale}</p>}
        </div>
      </div>

      {!compact && (
        <div className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border-subtle px-4 py-2.5 text-xs font-medium text-fg-secondary">Factors considered</div>
          <ul className="divide-y divide-border-subtle">
            {rec.factors.map((f) => {
              const e = EFFECT[f.effect];
              return (
                <li key={f.key} className="flex items-start gap-3 px-4 py-2.5">
                  <e.icon className={cn("mt-0.5 size-4 shrink-0", e.className)} aria-label={e.label} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-sm text-fg">{f.label}</span>
                      <span className="num text-sm font-medium capitalize">{f.value}</span>
                    </div>
                    <p className="text-xs text-fg-muted">{f.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-border-subtle px-4 py-2.5 text-2xs leading-relaxed text-fg-muted">
            <span className="font-medium text-fg-secondary">Method (simulated):</span> {rec.method} The real pricing formula is an open question for management.
          </p>
        </div>
      )}
    </div>
  );
}
