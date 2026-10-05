import { ArrowRight, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DECISION_META } from "@/components/business/badges";
import { ProvenanceTag } from "@/components/business/provenance";
import { Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { inventoryRepository, metaRepository } from "@/data-access";
import type { InventoryDecision } from "@/data-access/types";
import { DecisionTable } from "@/features/inventory/decision-table";
import { formatCurrencyCompact } from "@/lib/format";
import { param } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Keep / Replace / Eliminate" };

const STEPS = [
  { label: "Arrival / stock", detail: "Goods received into inventory" },
  { label: "Evaluate movement", detail: "Sales velocity, cover and age — calculated" },
  { label: "Recommendation", detail: "Rule-based suggestion — simulated" },
  { label: "Management decides", detail: "Keep · Review · Replace · Eliminate" },
];

const ORDER: InventoryDecision[] = ["keep", "review", "replace", "eliminate"];

export default async function DecisionsPage({ searchParams }: PageProps<"/inventory/decisions">) {
  const [items, meta] = await Promise.all([inventoryRepository.listDecisions(), metaRepository.getMeta()]);
  const raw = param(await searchParams, "decision");
  const filter = ORDER.find((d) => d === raw);
  const summary = ORDER.map((d) => {
    const m = items.filter((i) => i.recommendation.decision === d);
    return { decision: d, count: m.length, value: m.reduce((a, i) => a + i.stockValue, 0) };
  });

  return (
    <Page>
      <PageHeader
        eyebrow="Inventory · decision support"
        title="Keep, replace or eliminate"
        description="Decide on arrival and on stock. Every product is evaluated on movement and margin and given a suggested decision for management to accept or override."
        meta={<ProvenanceTag kind="simulated" label="Suggestions are simulated" />}
      />
      <div className="space-y-8">
        <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4" aria-label="Decision workflow">
          {STEPS.map((s, i) => (
            <li key={s.label} className="relative flex items-start gap-3 bg-surface p-4">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-fg">{i + 1}</span>
              <span>
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="text-xs text-fg-muted">{s.detail}</span>
              </span>
              {i < STEPS.length - 1 && <ArrowRight className="absolute top-5 right-3 hidden size-3.5 text-fg-subtle sm:block" aria-hidden />}
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.map((s) => {
            const active = filter === s.decision;
            return (
              <Link
                key={s.decision}
                href={active ? "/inventory/decisions" : `/inventory/decisions?decision=${s.decision}`}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={cn("rounded-lg border bg-surface p-4 transition-colors hover:border-border-strong", active ? "border-primary ring-1 ring-primary" : "border-border")}
              >
                <div className="text-sm font-medium">{DECISION_META[s.decision].label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">{s.count}</div>
                <div className="text-xs text-fg-muted">
                  {formatCurrencyCompact(s.value)} stock · {DECISION_META[s.decision].description.toLowerCase()}
                </div>
              </Link>
            );
          })}
        </div>

        <Notice tone="intel" icon={FlaskConical} title="What the suggestions are — and are not">
          Suggestions come from transparent rules over calculated movement, margin and stock age. They are not produced by a trained AI model. The real replacement and elimination criteria are open questions for management.
        </Notice>

        <Section key={filter ?? "all"} title="All products" description="Select rows to accept suggestions in bulk, or open one to review">
          <DecisionTable items={items} asOf={meta.asOf} mode="decisions" decisionFilter={filter} />
        </Section>
      </div>
    </Page>
  );
}
