import { SegmentBar } from "@/components/charts/bar-list";
import type { MovementBreakdown, MovementClass } from "@/data-access/types";
import { formatCurrencyCompact } from "@/lib/format";
import { MOVEMENT_META } from "./badges";

/** Status colours (movement health is a state), always shown with a label. */
export const MOVEMENT_COLOR: Record<MovementClass, string> = {
  fast: "var(--status-good)",
  normal: "var(--chart-comparison)",
  slow: "var(--status-warning)",
  dead: "var(--status-critical)",
};

export function InventoryHealthIndicator({ breakdown, metric = "stockValue" }: { breakdown: MovementBreakdown[]; metric?: "stockValue" | "products" }) {
  return (
    <div>
      <SegmentBar
        label="Stock value by movement class"
        segments={breakdown.map((b) => ({ key: b.movement, label: MOVEMENT_META[b.movement].label, value: b[metric], color: MOVEMENT_COLOR[b.movement] }))}
      />
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {breakdown.map((b) => (
          <li key={b.movement} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 size-2 shrink-0 rounded-[2px]" style={{ background: MOVEMENT_COLOR[b.movement] }} />
            <span className="min-w-0">
              <span className="block text-xs text-fg-muted">{MOVEMENT_META[b.movement].label}</span>
              <span className="num text-sm font-medium text-fg">{formatCurrencyCompact(b.stockValue)}</span>
              <span className="text-xs text-fg-muted"> · {b.products} items</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
