import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DecisionRecommendation } from "@/data-access/types";
import { cn } from "@/lib/utils";
import { ConfidenceIndicator, DECISION_META, DecisionBadge } from "./badges";
import { ProvenanceTag } from "./provenance";

/** AIRecommendationCard — always labelled as simulated, with reasons shown. */
export function RecommendationCard({ recommendation, actions, className, title = "Recommended action" }: { recommendation: DecisionRecommendation; actions?: ReactNode; className?: string; title?: string }) {
  const meta = DECISION_META[recommendation.decision];
  return (
    <section className={cn("rounded-lg border border-intel-border bg-surface", className)} aria-label={title}>
      <div className="flex items-center justify-between gap-2 border-b border-intel-border/60 bg-intel-soft/60 px-4 py-2.5">
        <span className="text-xs font-medium text-fg-secondary">{title}</span>
        <ProvenanceTag kind="simulated" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <DecisionBadge decision={recommendation.decision} className="h-6 px-2 text-xs" />
          <span className="text-xs text-fg-muted">{meta.description}</span>
        </div>
        <p className="mt-2.5 text-base leading-snug font-semibold text-fg">{recommendation.headline}</p>
        <ul className="mt-3 space-y-1.5">
          {recommendation.reasons.map((r) => (
            <li key={r} className="flex gap-2 text-xs text-fg-secondary">
              <Check className="mt-0.5 size-3 shrink-0 text-intel" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
        {recommendation.replacement && (
          <Link href={`/inventory/products/${recommendation.replacement.productId}`} className="mt-3 flex items-center gap-2 rounded-md border border-border-subtle bg-surface-muted px-3 py-2 text-xs hover:bg-surface-hover">
            <span className="min-w-0 flex-1">
              <span className="block text-fg-muted">Possible replacement</span>
              <span className="block truncate font-medium text-fg">{recommendation.replacement.name}</span>
              <span className="block text-fg-muted">{recommendation.replacement.reason}</span>
            </span>
            <ArrowRight className="size-3.5 text-fg-muted" />
          </Link>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <ConfidenceIndicator confidence={recommendation.confidence} />
          {actions && <div className="flex flex-wrap gap-1.5">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
