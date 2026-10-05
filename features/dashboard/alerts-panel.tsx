import { AlertOctagon, AlertTriangle, ArrowRight, Info, TrendingUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { ProvenanceTag } from "@/components/business/provenance";
import { Card, CardHeader } from "@/components/ui/card";
import type { ManagementAlert } from "@/data-access/types";
import { cn } from "@/lib/utils";

const SEVERITY: Record<ManagementAlert["severity"], { icon: LucideIcon; tone: string; label: string }> = {
  critical: { icon: AlertOctagon, tone: "text-danger bg-danger-soft", label: "Critical" },
  warning: { icon: AlertTriangle, tone: "text-warning bg-warning-soft", label: "Needs attention" },
  info: { icon: Info, tone: "text-info bg-info-soft", label: "For information" },
  positive: { icon: TrendingUp, tone: "text-success bg-success-soft", label: "Positive" },
};

export function AlertsPanel({ alerts, className }: { alerts: ManagementAlert[]; className?: string }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader title="Management alerts" description="What needs a decision today" actions={<ProvenanceTag kind="calculated" />} />
      <ul className="flex-1 divide-y divide-border-subtle border-t border-border-subtle">
        {alerts.slice(0, 7).map((a) => {
          const s = SEVERITY[a.severity];
          return (
            <li key={a.id}>
              <Link href={a.href} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover">
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md", s.tone)} title={s.label}>
                  <s.icon className="size-3.5" aria-hidden />
                  <span className="sr-only">{s.label}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug font-medium text-fg">{a.title}</span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-fg-muted">{a.detail}</span>
                </span>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
