import type { ComponentProps, ReactNode } from "react";
import { cn, clamp, initials } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("skeleton h-4", className)} {...props} />;
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-border bg-surface-muted px-1 font-sans text-2xs font-medium text-fg-muted", className)}>{children}</kbd>;
}

/**
 * Meter — a single-value bar. The track is a lighter step of the fill's own
 * family so state reads across the whole bar.
 */
export function Meter({ value, max = 100, tone = "primary", label, className }: { value: number; max?: number; tone?: "primary" | "success" | "warning" | "danger" | "info" | "neutral"; label: string; className?: string }) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  const fill = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info", neutral: "bg-fg-subtle" }[tone];
  const track = { primary: "bg-primary-soft", success: "bg-success-soft", warning: "bg-warning-soft", danger: "bg-danger-soft", info: "bg-info-soft", neutral: "bg-surface-muted" }[tone];
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={cn("h-1.5 w-full overflow-hidden rounded-full", track, className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Avatar({ name, className, tone = "neutral" }: { name: string; className?: string; tone?: "neutral" | "primary" | "brass" }) {
  const toneClass = { neutral: "bg-surface-muted text-fg-secondary", primary: "bg-primary-soft text-primary-soft-fg", brass: "bg-brass-soft text-brass" }[tone];
  return (
    <span aria-hidden className={cn("inline-grid size-7 shrink-0 place-items-center rounded-full text-2xs font-semibold", toneClass, className)}>
      {initials(name)}
    </span>
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
