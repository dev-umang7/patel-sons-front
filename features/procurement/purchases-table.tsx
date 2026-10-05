"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PURCHASE_STATUS, PurchaseStatusBadge } from "@/components/business/badges";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import type { PurchaseSummary } from "@/data-access/types";
import { formatCurrency, formatDateShort } from "@/lib/format";

const h = columnHelper<PurchaseSummary>();

export function PurchasesTable({ purchases, mode }: { purchases: PurchaseSummary[]; mode: "orders" | "history" }) {
  const columns = useMemo<DataColumn<PurchaseSummary>[]>(
    () => [
      h.accessor("number", {
        header: "Purchase",
        enableHiding: false,
        cell: ({ row }) => (
          <div>
            <Link href={`/procurement/purchases/${row.original.id}`} className="font-medium hover:underline">
              {row.original.number}
            </Link>
            <div className="text-2xs text-fg-muted">{row.original.categoryNames.join(" · ")}</div>
          </div>
        ),
      }),
      h.accessor("vendorName", { header: "Vendor", filterFn: "inSet", cell: (c) => <span className="whitespace-nowrap">{c.getValue()}</span> }),
      h.accessor("status", { header: "Status", filterFn: "inSet", cell: (c) => <PurchaseStatusBadge status={c.getValue()} /> }),
      h.accessor("orderedOn", { header: "Ordered", cell: (c) => <span className="whitespace-nowrap">{formatDateShort(c.getValue())}</span> }),
      h.accessor("expectedOn", {
        header: "Expected",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDateShort(row.original.expectedOn)}
            {row.original.isLate && <span className="ml-1.5 text-xs text-danger">{row.original.daysLate}d late</span>}
          </span>
        ),
      }),
      h.accessor("receivedOn", { header: "Received", sortUndefined: "last", cell: (c) => (c.getValue() ? <span className="whitespace-nowrap">{formatDateShort(c.getValue() as string)}</span> : "—") }),
      h.accessor("lineCount", { header: "Lines", meta: { align: "end" } }),
      h.accessor("units", { header: "Units", meta: { align: "end" }, cell: ({ row }) => (row.original.status === "partially-received" ? `${row.original.receivedUnits} / ${row.original.units}` : row.original.units) }),
      h.accessor("value", { header: "Value", meta: { align: "end" }, cell: (c) => <span className="font-medium">{formatCurrency(c.getValue())}</span> }),
      h.accessor("savings", { header: "Offer savings", meta: { align: "end" }, cell: (c) => (c.getValue() > 0 ? <span className="text-success">{formatCurrency(c.getValue())}</span> : "—") }),
    ],
    [],
  );
  return (
    <DataTable
      data={purchases}
      columns={columns}
      getRowId={(p) => p.id}
      rowHref={(p) => `/procurement/purchases/${p.id}`}
      entityName={{ singular: "purchase", plural: "purchases" }}
      searchPlaceholder="Search PO number or vendor…"
      initialSorting={[{ id: mode === "orders" ? "expectedOn" : "orderedOn", desc: mode !== "orders" }]}
      initialVisibility={mode === "orders" ? { receivedOn: false, savings: false } : {}}
      pageSize={mode === "orders" ? 25 : 50}
      filters={[
        { columnId: "status", label: "Status", options: [...new Set(purchases.map((p) => p.status))].map((s) => ({ value: s, label: PURCHASE_STATUS[s].label })) },
        { columnId: "vendorName", label: "Vendor", options: [...new Set(purchases.map((p) => p.vendorName))].sort().map((v) => ({ value: v, label: v })) },
      ]}
      mobileCard={(p) => (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{p.vendorName}</div>
            <div className="text-xs text-fg-muted">
              {p.number} · {formatDateShort(p.orderedOn)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="num text-sm font-medium">{formatCurrency(p.value)}</span>
            <PurchaseStatusBadge status={p.status} />
          </div>
        </div>
      )}
    />
  );
}
