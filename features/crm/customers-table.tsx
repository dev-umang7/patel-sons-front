"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LoyaltyTierBadge } from "@/components/business/badges";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import type { CustomerSummary } from "@/data-access/types";
import { formatCurrency, formatNumber, formatRelativeDays } from "@/lib/format";

type Row = CustomerSummary & { typeLabel: string; owes: "owes" | "clear" };
const h = columnHelper<Row>();

export function CustomersTable({ customers }: { customers: CustomerSummary[] }) {
  const rows = useMemo<Row[]>(() => customers.map((c) => ({ ...c, typeLabel: c.type === "business" ? "Business" : "Individual", owes: c.outstanding > 0 ? "owes" : "clear" })), [customers]);
  const columns = useMemo<DataColumn<Row>[]>(
    () => [
      h.accessor((r) => r.businessName ?? r.name, {
        id: "name",
        header: "Customer",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex min-w-52 items-center gap-2.5">
            <Avatar name={row.original.businessName ?? row.original.name} tone={row.original.type === "business" ? "brass" : "neutral"} />
            <div className="min-w-0">
              <Link href={`/crm/customers/${row.original.id}`} className="block truncate font-medium hover:underline">
                {row.original.businessName ?? row.original.name}
              </Link>
              <div className="truncate text-2xs text-fg-muted">{row.original.businessName ? `${row.original.name} · ${row.original.area}` : `${row.original.area} · ${row.original.phone}`}</div>
            </div>
          </div>
        ),
      }),
      h.accessor("typeLabel", { header: "Type", filterFn: "inSet", cell: (c) => <Badge tone="outline">{c.getValue()}</Badge> }),
      h.accessor("tierName", { header: "Loyalty", filterFn: "inSet", cell: (c) => <LoyaltyTierBadge tier={c.getValue()} /> }),
      h.accessor("spend12m", { header: "Spend · 12m", meta: { align: "end" }, cell: (c) => <span className="font-medium">{formatCurrency(Math.round(c.getValue()))}</span> }),
      h.accessor("bills", { header: "Bills", meta: { align: "end" } }),
      h.accessor("avgBill", { header: "Avg bill", meta: { align: "end" }, cell: (c) => formatCurrency(Math.round(c.getValue())) }),
      h.accessor("daysSinceLastPurchase", { header: "Last visit", meta: { align: "end" }, sortUndefined: "last", cell: (c) => (c.getValue() === null ? "—" : formatRelativeDays(c.getValue() as number)) }),
      h.accessor("pointsBalance", { header: "Points", meta: { align: "end" }, cell: (c) => formatNumber(c.getValue()) }),
      h.accessor("outstanding", { header: "Owes", meta: { align: "end" }, cell: ({ row }) => (row.original.outstanding > 0 ? <span className={row.original.overdue > 0 ? "font-medium text-danger" : "font-medium"}>{formatCurrency(row.original.outstanding)}</span> : <span className="text-fg-subtle">—</span>) }),
      h.accessor("owes", { header: "Dues", filterFn: "inSet", enableHiding: false }),
    ],
    [],
  );
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      rowHref={(r) => `/crm/customers/${r.id}`}
      entityName={{ singular: "customer", plural: "customers" }}
      searchPlaceholder="Search name, business, phone, area…"
      initialSorting={[{ id: "spend12m", desc: true }]}
      initialVisibility={{ owes: false }}
      filters={[
        { columnId: "typeLabel", label: "Type", options: [{ value: "Individual", label: "Individual" }, { value: "Business", label: "Business" }] },
        { columnId: "tierName", label: "Loyalty tier", options: ["Platinum", "Gold", "Silver", "Member"].map((t) => ({ value: t, label: t })) },
        { columnId: "owes", label: "Dues", options: [{ value: "owes", label: "Has outstanding dues" }, { value: "clear", label: "Nothing owed" }] },
      ]}
      mobileCard={(c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.businessName ?? c.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{c.businessName ?? c.name}</div>
            <div className="text-xs text-fg-muted">
              {formatCurrency(Math.round(c.spend12m))} · {c.bills} bills
            </div>
          </div>
          <LoyaltyTierBadge tier={c.tierName} />
        </div>
      )}
    />
  );
}
