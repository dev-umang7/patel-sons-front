import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-md bg-primary font-display text-[13px] leading-none font-semibold text-primary-fg", className)}>
      P&amp;S
    </span>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span className="truncate font-display text-[17px] font-semibold text-fg">Patel &amp; Sons</span>
      <span className="mt-1 text-2xs text-fg-muted">Business operating system</span>
    </span>
  );
}
