import { Calculator, Database, FlaskConical } from "lucide-react";
import type { Provenance } from "@/data-access/types";
import { cn } from "@/lib/utils";

const META: Record<Provenance, { label: string; icon: typeof Database; className: string; title: string }> = {
  recorded: { label: "Recorded", icon: Database, className: "text-fg-muted border-border", title: "Recorded business data" },
  calculated: { label: "Calculated", icon: Calculator, className: "text-info border-info/30", title: "Calculated from recorded data using documented rules" },
  simulated: { label: "Simulated", icon: FlaskConical, className: "text-intel border-intel-border bg-intel-soft", title: "Simulated recommendation from transparent rules — not a trained AI model" },
};

/** Visibly separates recorded data, calculated values and simulated intelligence. */
export function ProvenanceTag({ kind, className, label }: { kind: Provenance; className?: string; label?: string }) {
  const m = META[kind];
  return (
    <span title={m.title} className={cn("inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 text-2xs font-medium", m.className, className)}>
      <m.icon className="size-3" aria-hidden />
      {label ?? m.label}
    </span>
  );
}
