import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BarListItem {
  key: string;
  label: ReactNode;
  value: number;
  display: string;
  secondary?: ReactNode;
  href?: string;
}

/**
 * Ranked horizontal bars rendered as HTML — every value is plain text, so the
 * chart is its own table view. One hue: magnitude, not identity.
 */
export function BarList({ items, className, color = "var(--chart-primary)", max }: { items: BarListItem[]; className?: string; color?: string; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item) => {
        const pct = Math.max(0, (item.value / top) * 100);
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-fg">{item.label}</span>
              <span className="num shrink-0 font-medium text-fg">{item.display}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
              </div>
              {item.secondary && <span className="num w-16 shrink-0 text-right text-2xs text-fg-muted">{item.secondary}</span>}
            </div>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <Link href={item.href} className="-mx-2 block rounded-md px-2 py-1 transition-colors hover:bg-surface-hover">
                {content}
              </Link>
            ) : (
              <div className="py-1">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A single stacked bar for parts of a whole (e.g. stock value by movement). 2px surface gap between segments. */
export function SegmentBar({ segments, label, className }: { segments: { key: string; label: string; value: number; color: string }[]; label: string; className?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={className}>
      <div role="img" aria-label={label} className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div key={s.key} title={`${s.label}: ${Math.round((s.value / total) * 100)}%`} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
          ))}
      </div>
    </div>
  );
}
