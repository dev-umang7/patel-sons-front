"use client";

import Link from "next/link";
import { useMemo } from "react";
import { columnHelper, DataTable, type DataColumn } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/misc";
import type { VendorSummary } from "@/data-access/types";
import { formatCurrency, formatDateShort, formatPercent } from "@/lib/format";

const TYPE_LABEL: Record<VendorSummary["type"], string> = { distributor: "Distributor", wholesaler: "Wholesaler", "brand-direct": "Brand direct", manufacturer: "Manufacturer" };
const h = columnHelper<VendorSummary>();

export function VendorsTable({ vendors }: { vendors: VendorSummary[] }) {
  const columns = useMemo<DataColumn<VendorSummary>[]>(
    () => [
      h.accessor("name", {
        header: "Vendor",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="min-w-56">
            <Link href={`/procurement/vendors/${row.original.id}`} className="font-medium hover:underline">
              {row.original.name}
            </Link>
            <div className="text-2xs text-fg-muted">
              {row.original.city} · {row.original.contactPerson}
            </div>
          </div>
        ),
      }),
      h.accessor((r) => TYPE_LABEL[r.type], { id: "type", header: "Type", filterFn: "inSet", cell: (c) => <Badge tone="outline">{c.getValue()}</Badge> }),
      h.accessor((r) => r.brandNames.join(", "), { id: "brands", header: "Brands", cell: (c) => <span className="line-clamp-2 max-w-56 text-xs text-fg-secondary">{c.getValue()}</span> }),
      h.accessor("productCount", { header: "Products", meta: { align: "end" } }),
      h.accessor("purchaseValue", { header: "Purchased · 12m", meta: { align: "end" }, cell: (c) => formatCurrency(c.getValue()) }),
      h.accessor("onTimeRate", {
        header: "On time",
        meta: { align: "end" },
        sortUndefined: "last",
        cell: (c) => {
          const v = c.getValue() as number | null;
          return v === null ? (
            "—"
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Meter value={v} label="On-time delivery rate" tone={v >= 80 ? "success" : v >= 60 ? "warning" : "danger"} className="w-12" />
              {formatPercent(v, 0)}
            </div>
          );
        },
      }),
      h.accessor("bestPriceShare", { header: "Cheapest on", meta: { align: "end", label: "Share of quotes where cheapest" }, cell: (c) => formatPercent(c.getValue(), 0) }),
      h.accessor("paymentTermsDays", { header: "Terms", meta: { align: "end" }, cell: (c) => `${c.getValue()} d` }),
      h.accessor("leadTimeDays", { header: "Lead time", meta: { align: "end" }, cell: (c) => `${c.getValue()} d` }),
      h.accessor("liveOffers", { header: "Live offers", meta: { align: "end" }, cell: (c) => (c.getValue() > 0 ? <Badge tone="brass">{c.getValue()}</Badge> : "—") }),
      h.accessor("openOrders", { header: "Open POs", meta: { align: "end" } }),
      h.accessor("lastPurchaseOn", { header: "Last order", cell: (c) => (c.getValue() ? formatDateShort(c.getValue() as string) : "—") }),
    ],
    [],
  );
  return (
    <DataTable
      data={vendors}
      columns={columns}
      getRowId={(v) => v.id}
      rowHref={(v) => `/procurement/vendors/${v.id}`}
      entityName={{ singular: "vendor", plural: "vendors" }}
      searchPlaceholder="Search vendor, city, brand…"
      initialSorting={[{ id: "purchaseValue", desc: true }]}
      initialVisibility={{ paymentTermsDays: false, lastPurchaseOn: false }}
      filters={[{ columnId: "type", label: "Type", options: Object.values(TYPE_LABEL).map((v) => ({ value: v, label: v })) }]}
    />
  );
}
