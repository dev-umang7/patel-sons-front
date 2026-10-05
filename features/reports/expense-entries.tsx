"use client";

import Link from "next/link";
import { useMemo } from "react";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import type { Expense, ExpenseCategory } from "@/data-access/types";
import { formatCurrency, formatDate } from "@/lib/format";

const LABEL: Record<ExpenseCategory, string> = {
  rent: "Rent",
  salaries: "Salaries",
  utilities: "Utilities",
  freight: "Inward freight",
  marketing: "Marketing",
  packaging: "Packaging",
  maintenance: "Maintenance",
  "bank-charges": "Bank charges",
  miscellaneous: "Miscellaneous",
};

type Row = Expense & { categoryLabel: string };
const h = columnHelper<Row>();

export function ExpenseEntries({ entries }: { entries: Expense[] }) {
  const rows = useMemo<Row[]>(() => entries.map((e) => ({ ...e, categoryLabel: LABEL[e.category] })), [entries]);
  const columns = useMemo<DataColumn<Row>[]>(
    () => [
      h.accessor("date", { header: "Date", sortFn: "text", cell: (c) => <span className="whitespace-nowrap">{formatDate(c.getValue())}</span> }),
      h.accessor("description", {
        header: "Description",
        enableHiding: false,
        cell: ({ row }) =>
          row.original.purchaseId ? (
            <Link href={`/procurement/purchases/${row.original.purchaseId}`} className="hover:underline">
              {row.original.description}
            </Link>
          ) : (
            row.original.description
          ),
      }),
      h.accessor("categoryLabel", { header: "Category", filterFn: "inSet", cell: (c) => <Badge tone="outline">{c.getValue()}</Badge> }),
      h.accessor("payee", { header: "Paid to", cell: (c) => <span className="text-fg-secondary">{c.getValue()}</span> }),
      h.accessor("amount", { header: "Amount", meta: { align: "end" }, cell: (c) => <span className="font-medium">{formatCurrency(c.getValue())}</span> }),
    ],
    [],
  );
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      dense
      entityName={{ singular: "expense", plural: "expenses" }}
      searchPlaceholder="Search description or payee…"
      initialSorting={[{ id: "date", desc: true }]}
      filters={[{ columnId: "categoryLabel", label: "Category", options: Object.values(LABEL).map((v) => ({ value: v, label: v })) }]}
    />
  );
}
