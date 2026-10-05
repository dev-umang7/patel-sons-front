"use client";

import { useMemo } from "react";
import { MOVEMENT_META } from "@/components/business/badges";
import { MOVEMENT_COLOR } from "@/components/business/movement";
import { SegmentBar } from "@/components/charts/bar-list";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import type { BrandSummary, MovementClass } from "@/data-access/types";
import { formatCurrency, formatPercent } from "@/lib/format";

const h = columnHelper<BrandSummary>();
const CLASSES: MovementClass[] = ["fast", "normal", "slow", "dead"];

export function BrandsTable({ brands, initialSearch }: { brands: BrandSummary[]; initialSearch?: string }) {
  const columns = useMemo<DataColumn<BrandSummary>[]>(
    () => [
      h.accessor("name", {
        header: "Brand",
        enableHiding: false,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-2xs text-fg-muted">{row.original.categoryNames.join(" · ")}</div>
          </div>
        ),
      }),
      h.accessor("products", { header: "Products", meta: { align: "end" } }),
      h.accessor("revenue90", { header: "Sales · 90d", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("marginPercent", { header: "Margin", meta: { align: "end" }, cell: (c) => formatPercent(c.getValue()) }),
      h.accessor("stockValue", { header: "Stock value", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.display({
        id: "movement",
        header: "Movement mix",
        cell: ({ row }) => (
          <div className="w-36">
            <SegmentBar label={`Movement mix for ${row.original.name}`} segments={CLASSES.map((m) => ({ key: m, label: MOVEMENT_META[m].label, value: row.original.movement[m], color: MOVEMENT_COLOR[m] }))} />
          </div>
        ),
      }),
      h.accessor((r) => r.vendorNames.join(", "), { id: "vendors", header: "Vendors", cell: (c) => <span className="line-clamp-2 max-w-64 text-xs text-fg-secondary">{c.getValue()}</span> }),
    ],
    [],
  );
  return (
    <DataTable
      data={brands}
      columns={columns}
      getRowId={(b) => b.id}
      initialSearch={initialSearch}
      entityName={{ singular: "brand", plural: "brands" }}
      searchPlaceholder="Search brands or vendors…"
      initialSorting={[{ id: "revenue90", desc: true }]}
      pageSize={25}
    />
  );
}
