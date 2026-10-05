"use client";

import { CheckCheck, Download } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { DECISION_META, DecisionBadge, MOVEMENT_META, MovementBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import type { DecisionItem, InventoryDecision } from "@/data-access/types";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatCurrencyCompact, formatPercent, formatRelativeDays } from "@/lib/format";
import { recordDecision } from "./actions";
import { ReviewSheet } from "./review-sheet";

type Row = DecisionItem & { decision: InventoryDecision; vendor: string };
const h = columnHelper<Row>();

/** Used by both Slow-moving and Keep / Replace / Eliminate. Rows open a review drawer. */
export function DecisionTable({ items, asOf, mode, decisionFilter }: { items: DecisionItem[]; asOf: string; mode: "slow" | "decisions"; decisionFilter?: string }) {
  const [active, setActive] = useState<DecisionItem | null>(null);
  const [pending, start] = useTransition();
  const rows = useMemo<Row[]>(() => items.map((i) => ({ ...i, decision: i.recommendation.decision, vendor: i.lastVendorName ?? "—" })), [items]);

  const columns = useMemo<DataColumn<Row>[]>(
    () => [
      h.accessor("name", {
        header: "Product",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex min-w-56 items-center gap-3">
            <ProductThumb categoryName={row.original.categoryName} size="sm" />
            <div className="min-w-0">
              <div className="truncate font-medium">{row.original.name}</div>
              <div className="text-2xs text-fg-muted">{row.original.categoryName}</div>
            </div>
          </div>
        ),
      }),
      h.accessor("decision", {
        header: "Suggested",
        filterFn: "inSet",
        meta: { label: "Suggested decision (simulated)" },
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-0.5">
            <DecisionBadge decision={row.original.decision} />
            <span className="max-w-48 truncate text-2xs text-fg-muted">{row.original.recommendation.headline}</span>
          </div>
        ),
      }),
      h.accessor("categoryName", { header: "Category", filterFn: "inSet" }),
      h.accessor("vendor", { header: "Vendor", filterFn: "inSet", cell: (c) => <span className="whitespace-nowrap text-fg-secondary">{c.getValue()}</span> }),
      h.accessor("movement", { header: "Movement", filterFn: "inSet", cell: (c) => <MovementBadge movement={c.getValue()} compact /> }),
      h.accessor("daysSinceLastSale", {
        header: "Last sold",
        meta: { align: "end" },
        sortUndefined: "last",
        cell: (c) => (c.getValue() === null ? <span className="text-danger">Not this year</span> : formatRelativeDays(c.getValue() as number)),
      }),
      h.accessor("avgStockAgeDays", { header: "Stock age", meta: { align: "end" }, cell: (c) => (c.getValue() === null ? "—" : `${c.getValue()} d`) }),
      h.accessor("stockOnHand", { header: "Units", meta: { align: "end" } }),
      h.accessor("stockValue", { header: "Money tied up", meta: { align: "end" }, cell: (c) => <span className="font-medium">{formatCurrency(c.getValue())}</span> }),
      h.accessor("avgUnitCost", { header: "Purchase price", meta: { align: "end", label: "Purchase price (avg cost)" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("sellingPrice", { header: "Selling price", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("marginPercent", { header: "Margin", meta: { align: "end" }, cell: (c) => formatPercent(c.getValue()) }),
    ],
    [],
  );

  const accept = (selected: Row[], clear: () => void) =>
    start(async () => {
      const groups = new Map<InventoryDecision, string[]>();
      for (const r of selected) groups.set(r.decision, [...(groups.get(r.decision) ?? []), r.productId]);
      for (const [decision, productIds] of groups) {
        const res = await recordDecision({ productIds, decision });
        toast.success(res.message, { description: "Demo mode — validated but not saved yet." });
      }
      clear();
    });

  return (
    <>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.productId}
        onRowClick={(r) => setActive(r)}
        entityName={{ singular: "product", plural: "products" }}
        searchPlaceholder="Search products…"
        initialSorting={[{ id: "stockValue", desc: true }]}
        initialVisibility={{ categoryName: false, marginPercent: false, ...(mode === "decisions" ? { avgStockAgeDays: false, avgUnitCost: false } : {}) }}
        initialFilters={decisionFilter ? [{ id: "decision", value: [decisionFilter] }] : []}
        filters={[
          { columnId: "decision", label: "Suggested", options: (["keep", "review", "replace", "eliminate"] as const).map((d) => ({ value: d, label: DECISION_META[d].label })) },
          { columnId: "movement", label: "Movement", options: (["fast", "normal", "slow", "dead"] as const).map((m) => ({ value: m, label: MOVEMENT_META[m].label })) },
          { columnId: "categoryName", label: "Category", options: [...new Set(rows.map((r) => r.categoryName))].sort().map((v) => ({ value: v, label: v })) },
          { columnId: "vendor", label: "Vendor", options: [...new Set(rows.map((r) => r.vendor))].sort().map((v) => ({ value: v, label: v })) },
        ]}
        selectable
        bulkActions={(selected, clear) => (
          <>
            <Button size="sm" variant="primary" disabled={pending} onClick={() => accept(selected, clear)}>
              <CheckCheck /> Accept suggestions
            </Button>
            <Button
              size="sm"
              onClick={() =>
                downloadCsv(
                  "patel-sons-decisions.csv",
                  selected.map((r) => ({ SKU: r.sku, Product: r.name, Movement: r.movement, Units: r.stockOnHand, "Tied up": r.stockValue, Suggested: r.decision, Reason: r.recommendation.headline })),
                )
              }
            >
              <Download /> Export
            </Button>
          </>
        )}
        mobileCard={(r) => (
          <div className="flex items-center gap-3">
            <ProductThumb categoryName={r.categoryName} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.name}</div>
              <div className="text-xs text-fg-muted">
                {formatCurrencyCompact(r.stockValue)} · {r.daysSinceLastSale === null ? "not sold this year" : `last sold ${formatRelativeDays(r.daysSinceLastSale)}`}
              </div>
            </div>
            <DecisionBadge decision={r.decision} />
          </div>
        )}
      />
      <ReviewSheet item={active} asOf={asOf} onOpenChange={(open) => !open && setActive(null)} />
    </>
  );
}
