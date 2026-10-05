import { AlertTriangle, type LucideIcon, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Empty state: says what is empty, why it may be, and what to do next.
 * Never just "No data".
 */
export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <span className="mb-3 grid size-10 place-items-center rounded-lg border border-border bg-surface-muted text-fg-muted">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-fg-muted">{description}</p>
      {action && <div className="mt-4 flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="mb-3 grid size-10 place-items-center rounded-lg bg-danger-soft text-danger">
        <AlertTriangle className="size-5" strokeWidth={1.75} />
      </span>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-muted">{description}</p>
      {action && <div className="mt-4 flex items-center gap-2">{action}</div>}
    </div>
  );
}

/** Inline notice for assumptions, simulated output and open questions. */
export function Notice({
  tone = "neutral",
  icon: Icon,
  title,
  children,
  className,
}: {
  tone?: "neutral" | "intel" | "warning" | "info";
  icon?: LucideIcon;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const toneClass = {
    neutral: "border-border bg-surface-muted text-fg-secondary",
    intel: "border-intel-border bg-intel-soft text-fg-secondary",
    warning: "border-warning/30 bg-warning-soft text-fg-secondary",
    info: "border-info/25 bg-info-soft text-fg-secondary",
  }[tone];
  const iconClass = { neutral: "text-fg-muted", intel: "text-intel", warning: "text-warning", info: "text-info" }[tone];
  return (
    <div className={cn("flex gap-2.5 rounded-lg border px-3 py-2.5 text-xs leading-relaxed", toneClass, className)}>
      {Icon && <Icon className={cn("mt-px size-4 shrink-0", iconClass)} />}
      <div>
        {title && <div className="mb-0.5 font-medium text-fg">{title}</div>}
        {children}
      </div>
    </div>
  );
}
