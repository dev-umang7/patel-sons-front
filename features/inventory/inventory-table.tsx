"use client";

import { Download, Gift, Flag } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { MOVEMENT_META, MovementBadge, ProductStatusBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/data-access/types";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatCurrencyCompact, formatDateShort, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type StockState = "out" | "low" | "ok";
type Row = InventoryItem & { stockState: StockState };

const h = columnHelper<Row>();

export function InventoryTable({ items, view }: { items: InventoryItem[]; view?: string }) {
  const rows = useMemo<Row[]>(() => items.map((i) => ({ ...i, stockState: i.stockOnHand === 0 ? "out" : i.lowStock ? "low" : "ok" })), [items]);

  const columns = useMemo<DataColumn<Row>[]>(
    () => [
      h.accessor("name", {
        header: "Product",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex min-w-60 items-center gap-3">
            <ProductThumb categoryName={row.original.categoryName} size="sm" />
            <div className="min-w-0">
              <Link href={`/inventory/products/${row.original.productId}`} className="block truncate font-medium text-fg hover:underline">
                {row.original.name}
              </Link>
              <div className="truncate font-mono text-2xs text-fg-muted">{row.original.sku}</div>
            </div>
          </div>
        ),
      }),
      h.accessor("categoryName", { header: "Category", filterFn: "inSet", cell: (c) => <span className="whitespace-nowrap text-fg-secondary">{c.getValue()}</span> }),
      h.accessor("brandName", { header: "Brand", filterFn: "inSet", cell: (c) => <span className="text-fg-secondary">{c.getValue()}</span> }),
      h.accessor("movement", {
        header: "Movement",
        filterFn: "inSet",
        sortFn: (a, b) => ["fast", "normal", "slow", "dead"].indexOf(a.original.movement) - ["fast", "normal", "slow", "dead"].indexOf(b.original.movement),
        cell: (c) => <MovementBadge movement={c.getValue()} />,
      }),
      h.accessor("stockOnHand", {
        header: "Stock",
        meta: { align: "end" },
        cell: ({ row }) => (
          <div className="flex flex-col items-end">
            <span className={cn("font-medium", row.original.stockState !== "ok" && "text-danger")}>{formatNumber(row.original.stockOnHand)}</span>
            {row.original.onOrder > 0 ? <span className="text-2xs text-info">+{row.original.onOrder} on order</span> : row.original.stockState !== "ok" && <span className="text-2xs text-fg-muted">re-order at {row.original.reorderLevel}</span>}
          </div>
        ),
      }),
      h.accessor("stockValue", { header: "Stock value", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("sellingPrice", { header: "Selling price", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("avgUnitCost", { header: "Avg cost", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("marginPercent", {
        header: "Margin",
        meta: { align: "end" },
        cell: ({ row }) => <span className={cn(row.original.lowMargin && "font-medium text-warning")}>{formatPercent(row.original.marginPercent)}</span>,
      }),
      h.accessor("unitsSold90", { header: "Sold · 90d", meta: { align: "end" }, cell: (c) => formatNumber(c.getValue()) }),
      h.accessor("daysOfCover", {
        header: "Cover",
        meta: { align: "end", label: "Days of cover" },
        sortUndefined: "last",
        cell: (c) => (c.getValue() === null ? <span className="text-fg-subtle">—</span> : `${Math.round(c.getValue() as number)} d`),
      }),
      h.accessor("avgStockAgeDays", { header: "Stock age", meta: { align: "end", label: "Stock ageing" }, cell: (c) => (c.getValue() === null ? "—" : `${c.getValue()} d`) }),
      h.accessor("lastSaleOn", { header: "Last sale", cell: (c) => (c.getValue() ? <span className="whitespace-nowrap text-fg-secondary">{formatDateShort(c.getValue()!)}</span> : <span className="text-fg-subtle">Never</span>) }),
      h.accessor("lastPurchaseOn", { header: "Last purchase", cell: (c) => (c.getValue() ? <span className="whitespace-nowrap text-fg-secondary">{formatDateShort(c.getValue()!)}</span> : "—") }),
      h.accessor((r) => r.lastVendorName ?? "—", { id: "lastVendor", header: "Last vendor", filterFn: "inSet", cell: (c) => <span className="whitespace-nowrap text-fg-secondary">{c.getValue()}</span> }),
      h.accessor("status", { header: "Status", filterFn: "inSet", cell: (c) => <ProductStatusBadge status={c.getValue()} /> }),
      h.accessor("stockState", { header: "Stock state", filterFn: "inSet", enableHiding: false, enableGlobalFilter: false }),
      h.accessor("sku", { header: "SKU", enableHiding: false }),
    ],
    [],
  );

  const options = (key: keyof Row) => [...new Set(rows.map((r) => String(r[key] ?? "—")))].sort().map((v) => ({ value: v, label: v }));
  const initialFilters = view === "low-stock" ? [{ id: "stockState", value: ["low", "out"] }] : view === "out-of-stock" ? [{ id: "stockState", value: ["out"] }] : [];

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.productId}
      rowHref={(r) => `/inventory/products/${r.productId}`}
      searchPlaceholder="Search name, SKU, brand…"
      searchLabel="Search products"
      entityName={{ singular: "product", plural: "products" }}
      initialSorting={[{ id: "stockValue", desc: true }]}
      initialVisibility={{ avgUnitCost: false, daysOfCover: false, avgStockAgeDays: false, lastPurchaseOn: false, lastVendor: false, status: false, stockState: false, sku: false, brandName: false }}
      initialFilters={initialFilters}
      filters={[
        { columnId: "categoryName", label: "Category", options: options("categoryName") },
        { columnId: "movement", label: "Movement", options: (["fast", "normal", "slow", "dead"] as const).map((m) => ({ value: m, label: MOVEMENT_META[m].label })) },
        { columnId: "brandName", label: "Brand", options: options("brandName") },
        { columnId: "lastVendor", label: "Vendor", options: [...new Set(rows.map((r) => r.lastVendorName ?? "—"))].sort().map((v) => ({ value: v, label: v })) },
        { columnId: "stockState", label: "Stock", options: [{ value: "out", label: "Out of stock" }, { value: "low", label: "Low stock" }, { value: "ok", label: "Healthy" }] },
      ]}
      selectable
      bulkActions={(selected, clear) => (
        <>
          <Button size="sm" onClick={() => { toast.success(`${selected.length} products marked for review`, { description: "Demo mode — this isn't saved yet." }); clear(); }}>
            <Flag /> Mark for review
          </Button>
          <Button size="sm" asChild>
            <Link href={`/intelligence/gift-selection?include=${selected.map((s) => s.productId).join(",")}`}>
              <Gift /> Use in gift selection
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() =>
              downloadCsv(
                "patel-sons-inventory.csv",
                selected.map((r) => ({ SKU: r.sku, Product: r.name, Category: r.categoryName, Brand: r.brandName, Stock: r.stockOnHand, "Stock value": r.stockValue, "Selling price": r.sellingPrice, "Margin %": r.marginPercent.toFixed(1), Movement: r.movement })),
              )
            }
          >
            <Download /> Export CSV
          </Button>
        </>
      )}
      mobileCard={(r) => (
        <div className="flex items-center gap-3">
          <ProductThumb categoryName={r.categoryName} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{r.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
              <span>{formatNumber(r.stockOnHand)} in stock</span>·<span>{formatCurrencyCompact(r.stockValue)}</span>
            </div>
          </div>
          <MovementBadge movement={r.movement} compact />
        </div>
      )}
    />
  );
}
