"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DebtStatusBadge, RECEIVABLE_STATUS } from "@/components/business/badges";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import type { ReceivableView } from "@/data-access/types";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReceivableSheet } from "./receivable-sheet";

const h = columnHelper<ReceivableView>();

export function ReceivablesTable({ receivables, asOf, initialStatus }: { receivables: ReceivableView[]; asOf: string; initialStatus?: string }) {
  const [active, setActive] = useState<ReceivableView | null>(null);
  const columns = useMemo<DataColumn<ReceivableView>[]>(
    () => [
      h.accessor("customerName", {
        header: "Customer",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="min-w-44">
            <Link href={`/crm/customers/${row.original.customerId}`} className="font-medium hover:underline">
              {row.original.customerName}
            </Link>
            <div className="text-2xs text-fg-muted">{row.original.phone}</div>
          </div>
        ),
      }),
      h.accessor("billNumber", { header: "Bill", cell: ({ row }) => <Link href={`/sales/bills/${row.original.billId}`} className="text-xs whitespace-nowrap hover:underline">{row.original.billNumber}</Link> }),
      h.accessor("status", { header: "Status", filterFn: "inSet", sortFn: "text", cell: (c) => <DebtStatusBadge status={c.getValue()} /> }),
      h.accessor("amount", { header: "Original", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("paid", { header: "Paid", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("outstanding", { header: "Outstanding", meta: { align: "end" }, cell: (c) => <span className="font-semibold">{formatCurrency(c.getValue())}</span> }),
      h.accessor("dueOn", { header: "Due", cell: (c) => <span className="whitespace-nowrap">{formatDateShort(c.getValue())}</span> }),
      h.accessor("daysOverdue", { header: "Ageing", meta: { align: "end" }, cell: ({ row }) => <span className={cn(row.original.status === "critical" && "font-medium text-danger")}>{row.original.daysOverdue > 0 ? `${row.original.daysOverdue} d` : "—"}</span> }),
      h.accessor("lastPaymentOn", { header: "Last payment", sortUndefined: "last", cell: ({ row }) => (row.original.lastPaymentOn ? <span className="whitespace-nowrap text-xs">{formatCurrency(row.original.lastPaymentAmount ?? 0)} · {formatDateShort(row.original.lastPaymentOn)}</span> : <span className="text-fg-subtle">None</span>) }),
      h.accessor("nextAction", { header: "Next action", cell: (c) => <span className="text-xs whitespace-nowrap text-fg-secondary">{c.getValue()}</span> }),
    ],
    [],
  );
  return (
    <>
      <DataTable
        data={receivables}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={setActive}
        entityName={{ singular: "receivable", plural: "receivables" }}
        searchPlaceholder="Search customer or bill…"
        initialFilters={[{ id: "status", value: initialStatus ? [initialStatus] : ["critical", "overdue", "due-soon", "current"] }]}
        filters={[{ columnId: "status", label: "Status", options: (["critical", "overdue", "due-soon", "current", "paid"] as const).map((s) => ({ value: s, label: RECEIVABLE_STATUS[s].label })) }]}
        mobileCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{r.customerName}</div>
              <div className="text-xs text-fg-muted">
                {r.billNumber} · due {formatDateShort(r.dueOn)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="num text-sm font-semibold">{formatCurrency(r.outstanding)}</span>
              <DebtStatusBadge status={r.status} />
            </div>
          </div>
        )}
      />
      <ReceivableSheet receivable={active} asOf={asOf} onOpenChange={(o) => !o && setActive(null)} />
    </>
  );
}
