import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatSignedPercent } from "@/lib/format";
import { cn, percentChange } from "@/lib/utils";
import { AnimatedNumber, type NumberFormat } from "./animated-number";

/** Signed change vs a named period; colour = direction × whether up is good. */
export function Delta({ current, previous, upIsGood = true, suffix, className }: { current: number; previous: number; upIsGood?: boolean; suffix?: string; className?: string }) {
  const change = percentChange(current, previous);
  if (change === null) return <span className={cn("text-xs text-fg-subtle", className)}>No prior data</span>;
  const flat = Math.abs(change) < 0.5;
  const good = flat ? null : change > 0 === upIsGood;
  const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", good === null ? "text-fg-muted" : good ? "text-success" : "text-danger", className)}>
      <Icon className="size-3.5" aria-hidden />
      <span>{formatSignedPercent(change)}</span>
      {suffix && <span className="ml-1 font-normal text-fg-muted">{suffix}</span>}
    </span>
  );
}

export interface MetricProps {
  label: string;
  value: number;
  format?: NumberFormat;
  previous?: number;
  upIsGood?: boolean;
  caption?: ReactNode;
  href?: string;
  emphasis?: boolean;
}

export function Metric({ label, value, format = "currency-compact", previous, upIsGood = true, caption, href, emphasis }: MetricProps) {
  const body = (
    <>
      <div className="text-xs text-fg-muted">{label}</div>
      <div className={cn("mt-1.5 font-semibold tracking-tight text-fg", emphasis ? "text-[30px] leading-9" : "text-2xl")}>
        <AnimatedNumber value={value} format={format} />
      </div>
      <div className="mt-1.5 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-0.5">
        {previous !== undefined && <Delta current={value} previous={previous} upIsGood={upIsGood} />}
        {caption && <span className="text-xs text-fg-muted">{caption}</span>}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="group block bg-surface p-4 transition-colors hover:bg-surface-hover">
      {body}
    </Link>
  ) : (
    <div className="bg-surface p-4">{body}</div>
  );
}

/** A row of related figures on one divided surface — not a row of separate cards. */
export function MetricStrip({ children, columns = 4, className }: { children: ReactNode; columns?: 2 | 3 | 4 | 5 | 6; className?: string }) {
  const cols = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" }[columns];
  return <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border shadow-xs", cols, className)}>{children}</div>;
}

export function KeyValue({ items, className, columns = 1 }: { items: { label: ReactNode; value: ReactNode; hint?: ReactNode }[]; className?: string; columns?: 1 | 2 }) {
  return (
    <dl className={cn("grid gap-x-6", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1", className)}>
      {items.map((item, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2 last:border-0">
          <dt className="text-xs text-fg-muted">{item.label}</dt>
          <dd className="text-right text-sm text-fg">
            {item.value}
            {item.hint && <div className="text-2xs text-fg-muted">{item.hint}</div>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
