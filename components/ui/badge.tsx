import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 text-2xs font-medium leading-none [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-fg-secondary",
        outline: "border border-border text-fg-secondary",
        primary: "bg-primary-soft text-primary-soft-fg",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        brass: "bg-brass-soft text-brass",
        intel: "bg-intel-soft text-intel",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Small coloured dot + label, for statuses inside dense tables. */
export function StatusDot({ tone = "neutral", children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  const dot: Record<BadgeTone, string> = {
    neutral: "bg-fg-subtle",
    outline: "bg-fg-subtle",
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    brass: "bg-brass",
    intel: "bg-intel",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-fg-secondary", className)}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
