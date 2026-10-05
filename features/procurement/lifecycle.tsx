import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const PROCUREMENT_STEPS = [
  { key: "discover", label: "Discover", href: "/procurement/offers" },
  { key: "compare", label: "Compare", href: "/procurement/sources" },
  { key: "decide", label: "Decide", href: "/intelligence/pricing" },
  { key: "purchase", label: "Purchase", href: "/procurement/orders" },
  { key: "receive", label: "Receive", href: "/procurement/purchases" },
  { key: "inventory", label: "Inventory", href: "/inventory" },
] as const;

export type ProcurementStep = (typeof PROCUREMENT_STEPS)[number]["key"];

/** Makes the procurement lifecycle visible on every procurement page. */
export function ProcurementLifecycle({ current, completedThrough, className }: { current?: ProcurementStep; completedThrough?: ProcurementStep; className?: string }) {
  const doneIndex = completedThrough ? PROCUREMENT_STEPS.findIndex((s) => s.key === completedThrough) : -1;
  return (
    <nav aria-label="Procurement lifecycle" className={cn("scrollbar-thin overflow-x-auto", className)}>
      <ol className="flex min-w-max items-center gap-1 text-xs">
        {PROCUREMENT_STEPS.map((s, i) => {
          const done = i <= doneIndex;
          const active = s.key === current;
          return (
            <li key={s.key} className="flex items-center gap-1">
              <Link
                href={s.href}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 transition-colors",
                  active ? "border-primary bg-primary-soft font-medium text-primary-soft-fg" : done ? "border-border bg-surface text-fg-secondary" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                <span className={cn("grid size-4 place-items-center rounded-full text-2xs", active ? "bg-primary text-primary-fg" : done ? "bg-success text-fg-inverse" : "bg-surface-muted text-fg-muted")}>
                  {done && !active ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
                </span>
                {s.label}
              </Link>
              {i < PROCUREMENT_STEPS.length - 1 && <span aria-hidden className="h-px w-4 bg-border-strong" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
