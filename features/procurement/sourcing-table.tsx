"use client";

import { Tag } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { MOVEMENT_META, MovementBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import type { SourcingRow } from "@/data-access/types";
import { formatCurrency, formatPercent, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = SourcingRow & { needs: "reorder" | "ok"; offers: "yes" | "no" };
const h = columnHelper<Row>();

/** Discover & compare: every product's sourcing position. Selecting a row opens its comparison. */
export function SourcingTable({ rows: input }: { rows: SourcingRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = params.get("product");
  const rows = useMemo<Row[]>(() => input.map((r) => ({ ...r, needs: r.lowStock ? "reorder" : "ok", offers: r.liveOffers > 0 ? "yes" : "no" })), [input]);

  const columns = useMemo<DataColumn<Row>[]>(
    () => [
      h.accessor("name", {
        header: "Product",
        enableHiding: false,
        cell: ({ row }) => (
          <div className={cn("flex min-w-56 items-center gap-3", row.original.productId === selected && "font-semibold")}>
            <ProductThumb categoryName={row.original.categoryName} size="sm" />
            <div className="min-w-0">
              <div className="truncate">{row.original.name}</div>
              <div className="text-2xs font-normal text-fg-muted">
                {row.original.brandName} · {row.original.sourceCount} sources
              </div>
            </div>
          </div>
        ),
      }),
      h.accessor("categoryName", { header: "Category", filterFn: "inSet" }),
      h.accessor("bestVendorName", { header: "Best source", cell: (c) => <span className="whitespace-nowrap">{c.getValue()}</span> }),
      h.accessor("bestCost", { header: "Best cost", meta: { align: "end" }, cell: (c) => <span className="font-medium">{formatCurrency(c.getValue())}</span> }),
      h.accessor("spreadPercent", { header: "Spread", meta: { align: "end", label: "Spread between sources" }, cell: (c) => formatPercent(c.getValue()) }),
      h.accessor("lastPaidCost", { header: "Last paid", meta: { align: "end" }, cell: (c) => (c.getValue() === null ? "—" : formatCurrency(c.getValue() as number)) }),
      h.accessor("changeVsLastPaidPercent", {
        header: "vs last paid",
        meta: { align: "end" },
        sortUndefined: "last",
        cell: (c) => {
          const v = c.getValue() as number | null;
          if (v === null) return "—";
          return <span className={cn(v > 0.5 ? "text-danger" : v < -0.5 ? "text-success" : "text-fg-muted")}>{formatSignedPercent(v)}</span>;
        },
      }),
      h.accessor("bestMarginPercent", { header: "Margin at best", meta: { align: "end" }, cell: (c) => formatPercent(c.getValue()) }),
      h.accessor("offers", {
        header: "Offers",
        filterFn: "inSet",
        cell: ({ row }) =>
          row.original.liveOffers > 0 ? (
            <Badge tone="brass">
              <Tag /> {row.original.liveOffers} live
            </Badge>
          ) : (
            <span className="text-fg-subtle">—</span>
          ),
      }),
      h.accessor("stockOnHand", { header: "Stock", meta: { align: "end" }, cell: ({ row }) => <span className={cn(row.original.lowStock && "font-medium text-danger")}>{row.original.stockOnHand}</span> }),
      h.accessor("movement", { header: "Movement", filterFn: "inSet", cell: (c) => <MovementBadge movement={c.getValue()} compact /> }),
      h.accessor("needs", { header: "Needs re-order", filterFn: "inSet", enableHiding: false }),
    ],
    [selected],
  );

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.productId}
      onRowClick={(r) => {
        const next = new URLSearchParams(params.toString());
        next.set("product", r.productId);
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      entityName={{ singular: "product", plural: "products" }}
      searchPlaceholder="Find a product to compare…"
      initialSorting={[{ id: "spreadPercent", desc: true }]}
      initialVisibility={{ needs: false, categoryName: false }}
      filters={[
        { columnId: "needs", label: "Re-order", options: [{ value: "reorder", label: "At or below re-order level" }, { value: "ok", label: "Stock healthy" }] },
        { columnId: "offers", label: "Offers", options: [{ value: "yes", label: "Has a live offer" }, { value: "no", label: "No live offer" }] },
        { columnId: "categoryName", label: "Category", options: [...new Set(rows.map((r) => r.categoryName))].sort().map((v) => ({ value: v, label: v })) },
        { columnId: "movement", label: "Movement", options: (["fast", "normal", "slow", "dead"] as const).map((m) => ({ value: m, label: MOVEMENT_META[m].label })) },
      ]}
      mobileCard={(r) => (
        <div className="flex items-center gap-3">
          <ProductThumb categoryName={r.categoryName} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{r.name}</div>
            <div className="text-xs text-fg-muted">
              Best {formatCurrency(r.bestCost)} · {r.bestVendorName}
            </div>
          </div>
          {r.liveOffers > 0 && <Badge tone="brass">Offer</Badge>}
        </div>
      )}
    />
  );
}
