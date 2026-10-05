import Link from "next/link";
import type { ReactNode } from "react";
import { formatCurrency, formatNumber, formatPercent, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CellFormat = "text" | "currency" | "number" | "percent" | "signed-percent";

export interface ReportColumn<T> {
  key: keyof T & string;
  label: string;
  format?: CellFormat;
  /** Colour signed values: positive good (default) or bad. */
  tone?: "up-good" | "up-bad";
  render?: (row: T) => ReactNode;
}

function fmt(value: unknown, format: CellFormat): string {
  if (value === null || value === undefined) return "—";
  if (typeof value !== "number") return String(value);
  switch (format) {
    case "currency":
      return formatCurrency(Math.round(value));
    case "number":
      return formatNumber(value);
    case "percent":
      return formatPercent(value);
    case "signed-percent":
      return formatSignedPercent(value);
    default:
      return String(value);
  }
}

/** Dense, readable report table. Server-rendered; totals row optional. */
export function ReportTable<T extends object>({
  columns,
  rows,
  rowKey,
  href,
  totals,
  caption,
}: {
  columns: ReportColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  href?: (row: T) => string;
  totals?: Partial<Record<keyof T & string, ReactNode>>;
  caption?: string;
}) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[640px] text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border text-xs text-fg-muted">
            {columns.map((c, i) => (
              <th key={c.key} scope="col" className={cn("h-9 px-3 font-medium whitespace-nowrap first:pl-4 last:pr-4", i === 0 || c.format === "text" ? "text-left" : "text-right")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover">
              {columns.map((c, i) => {
                const value: unknown = row[c.key];
                const signed = c.format === "signed-percent" && typeof value === "number";
                const good = signed ? (c.tone === "up-bad" ? value < 0 : value > 0) : null;
                const content = c.render ? c.render(row) : fmt(value, c.format ?? "text");
                return (
                  <td key={c.key} className={cn("h-10 px-3 first:pl-4 last:pr-4", i === 0 || c.format === "text" ? "text-left" : "num text-right whitespace-nowrap", signed && Math.abs(value as number) >= 0.5 && (good ? "text-success" : "text-danger"))}>
                    {i === 0 && href ? (
                      <Link href={href(row)} className="font-medium hover:underline">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="border-t border-border bg-surface-muted font-medium">
              {columns.map((c, i) => (
                <td key={c.key} className={cn("h-10 px-3 first:pl-4 last:pr-4", i === 0 ? "text-left" : "num text-right whitespace-nowrap")}>
                  {totals[c.key] ?? (i === 0 ? "Total" : "")}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
