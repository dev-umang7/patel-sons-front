"use client";

import Link from "next/link";
import { useMemo } from "react";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import type { StockMovementRow } from "@/data-access/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE = { opening: { label: "Opening", tone: "neutral" }, purchase: { label: "Received", tone: "info" }, sale: { label: "Sold", tone: "success" }, adjustment: { label: "Adjustment", tone: "warning" } } as const;
const h = columnHelper<StockMovementRow>();

function refHref(r: StockMovementRow): string | null {
  if (r.reference.kind === "bill") return `/sales/bills/${r.reference.id}`;
  if (r.reference.kind === "purchase") return `/procurement/purchases/${r.reference.id}`;
  return null;
}

export function MovementTable({ rows }: { rows: StockMovementRow[] }) {
  const columns = useMemo<DataColumn<StockMovementRow>[]>(
    () => [
      h.accessor("date", { header: "Date", sortFn: "text", cell: (c) => <span className="whitespace-nowrap">{formatDate(c.getValue())}</span> }),
      h.accessor("productName", {
        header: "Product",
        enableHiding: false,
        cell: ({ row }) => (
          <Link href={`/inventory/products/${row.original.productId}`} className="font-medium hover:underline">
            {row.original.productName}
          </Link>
        ),
      }),
      h.accessor("categoryName", { header: "Category", filterFn: "inSet" }),
      h.accessor("type", { header: "Movement", filterFn: "inSet", cell: ({ row }) => <Badge tone={TYPE[row.original.type].tone}>{TYPE[row.original.type].label}</Badge> }),
      h.accessor((r) => r.reference.label, {
        id: "reference",
        header: "Reference",
        cell: ({ row }) => {
          const href = refHref(row.original);
          return href ? (
            <Link href={href} className="text-xs hover:underline">
              {row.original.reference.label}
            </Link>
          ) : (
            <span className="text-xs text-fg-muted">{row.original.reference.label}</span>
          );
        },
      }),
      h.accessor("quantity", { header: "Qty", meta: { align: "end" }, cell: (c) => <span className={cn("font-medium", c.getValue() > 0 && "text-success")}>{c.getValue() > 0 ? `+${c.getValue()}` : c.getValue()}</span> }),
      h.accessor("balanceAfter", { header: "Balance after", meta: { align: "end" } }),
    ],
    [],
  );
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      dense
      entityName={{ singular: "movement", plural: "movements" }}
      searchPlaceholder="Search product, bill or PO…"
      initialSorting={[{ id: "date", desc: true }]}
      pageSize={50}
      filters={[
        { columnId: "type", label: "Movement", options: Object.entries(TYPE).map(([value, t]) => ({ value, label: t.label })) },
        { columnId: "categoryName", label: "Category", options: [...new Set(rows.map((r) => r.categoryName))].sort().map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}
