"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BillKindBadge, PAYMENT_MODE_LABEL } from "@/components/business/badges";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import type { BillSummary } from "@/data-access/types";
import { formatCurrency, formatDateShort, formatWeekday } from "@/lib/format";

type Row = BillSummary & { customerLabel: string; mode: string; billKind: string };
const h = columnHelper<Row>();

export function BillsTable({ bills, compact }: { bills: BillSummary[]; compact?: boolean }) {
  const rows = useMemo<Row[]>(() => bills.map((b) => ({ ...b, customerLabel: b.customerName ?? "Walk-in", mode: PAYMENT_MODE_LABEL[b.paymentMode], billKind: b.kind === "gift" ? "Gift bill" : "Standard" })), [bills]);
  const columns = useMemo<DataColumn<Row>[]>(
    () => [
      h.accessor("number", {
        header: "Bill",
        enableHiding: false,
        cell: ({ row }) => (
          <Link href={`/sales/bills/${row.original.id}`} className="font-medium whitespace-nowrap hover:underline">
            {row.original.number}
          </Link>
        ),
      }),
      h.accessor("date", { header: "Date", sortFn: "text", cell: (c) => <span className="whitespace-nowrap">{formatWeekday(c.getValue())}, {formatDateShort(c.getValue())}</span> }),
      h.accessor("customerLabel", {
        header: "Customer",
        cell: ({ row }) =>
          row.original.customerId ? (
            <Link href={`/crm/customers/${row.original.customerId}`} className="hover:underline">
              {row.original.customerLabel}
            </Link>
          ) : (
            <span className="text-fg-muted">Walk-in</span>
          ),
      }),
      h.accessor((r) => r.categoryNames.join(", "), { id: "categories", header: "Categories", cell: (c) => <span className="line-clamp-1 max-w-56 text-xs text-fg-secondary">{c.getValue()}</span> }),
      h.accessor("units", { header: "Units", meta: { align: "end" } }),
      h.accessor("discount", { header: "Discount", meta: { align: "end" }, cell: ({ row }) => (row.original.discount > 0 ? <span title={row.original.couponCode ?? "Points redeemed"}>{formatCurrency(row.original.discount)}</span> : "—") }),
      h.accessor("net", { header: "Amount", meta: { align: "end" }, cell: (c) => <span className="font-medium">{formatCurrency(c.getValue())}</span> }),
      h.accessor("profit", { header: "Gross profit", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("mode", { header: "Payment", filterFn: "inSet", cell: (c) => (c.getValue() === "Credit" ? <Badge tone="warning">Credit</Badge> : <span className="text-fg-secondary">{c.getValue()}</span>) }),
      h.accessor("billKind", { header: "Type", filterFn: "inSet", cell: ({ row }) => <BillKindBadge kind={row.original.kind} /> }),
      h.accessor((r) => r.couponCode ?? "—", { id: "coupon", header: "Coupon", cell: (c) => (c.getValue() === "—" ? "—" : <Badge tone="primary">{c.getValue()}</Badge>) }),
    ],
    [],
  );
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      rowHref={(r) => `/sales/bills/${r.id}`}
      dense
      entityName={{ singular: "bill", plural: "bills" }}
      searchPlaceholder="Search bill number or customer…"
      initialSorting={[{ id: "date", desc: true }]}
      initialVisibility={compact ? { categories: false, profit: false, coupon: false, discount: false } : { coupon: false }}
      pageSize={compact ? 10 : 50}
      filters={[
        { columnId: "mode", label: "Payment", options: Object.values(PAYMENT_MODE_LABEL).map((v) => ({ value: v, label: v })) },
        { columnId: "billKind", label: "Bill type", options: [{ value: "Standard", label: "Standard" }, { value: "Gift bill", label: "Gift bill" }] },
      ]}
      mobileCard={(b) => (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{b.customerLabel}</div>
            <div className="text-xs text-fg-muted">
              {b.number} · {formatDateShort(b.date)} · {b.mode}
            </div>
          </div>
          <span className="num text-sm font-medium">{formatCurrency(b.net)}</span>
        </div>
      )}
    />
  );
}
