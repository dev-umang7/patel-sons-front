"use client";

import type { ReactNode } from "react";

export interface TooltipRow {
  key: string;
  label: string;
  value: string;
  color: string;
  dashed?: boolean;
}

/** Values lead, labels follow; series keyed with a short line, not a box. */
export function ChartTooltipCard({ title, rows, footer }: { title: ReactNode; rows: TooltipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-40 rounded-md border border-border bg-surface px-3 py-2 shadow-md">
      <div className="mb-1.5 text-2xs font-medium text-fg-muted">{title}</div>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2">
            <svg width="12" height="4" aria-hidden className="shrink-0">
              <line x1="0" y1="2" x2="12" y2="2" stroke={r.color} strokeWidth="2" strokeDasharray={r.dashed ? "3 2" : undefined} strokeLinecap="round" />
            </svg>
            <span className="num text-sm font-semibold text-fg">{r.value}</span>
            <span className="text-xs text-fg-muted">{r.label}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-1.5 border-t border-border-subtle pt-1.5 text-2xs text-fg-muted">{footer}</div>}
    </div>
  );
}

export function Legend({ items, className }: { items: { label: string; color: string; kind?: "line" | "box" | "dashed" }[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className ?? ""}`}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-xs text-fg-secondary">
          {i.kind === "box" ? (
            <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: i.color }} />
          ) : (
            <svg width="14" height="4" aria-hidden>
              <line x1="1" y1="2" x2="13" y2="2" stroke={i.color} strokeWidth="2" strokeLinecap="round" strokeDasharray={i.kind === "dashed" ? "3 2" : undefined} />
            </svg>
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
