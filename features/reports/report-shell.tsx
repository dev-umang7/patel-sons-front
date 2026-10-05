import type { ReactNode } from "react";
import { FilterBar, type FilterDef } from "@/components/forms/filter-bar";
import { PeriodPicker } from "@/components/forms/period-picker";
import { Page, PageHeader } from "@/components/layout/page";
import type { DatasetMeta } from "@/data-access/types";
import { formatDate } from "@/lib/format";
import type { ResolvedPeriod } from "@/lib/period";

/** Shared frame for every report: title, period, dimension filters, export. */
export function ReportShell({
  title,
  description,
  period,
  meta,
  filters = [],
  actions,
  children,
}: {
  title: string;
  description: string;
  period: ResolvedPeriod;
  meta: DatasetMeta;
  filters?: FilterDef[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Page>
      <PageHeader back={{ href: "/reports", label: "All reports" }} eyebrow={`Report · ${formatDate(period.from)} – ${formatDate(period.to)}`} title={title} description={description} actions={actions} />
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <PeriodPicker period={period} asOf={meta.asOf} historyStart={meta.historyStart} />
        {filters.length > 0 && <FilterBar filters={filters} />}
        <span className="ml-auto text-xs text-fg-muted">Compared with {formatDate(period.previous.from)} – {formatDate(period.previous.to)}</span>
      </div>
      <div className="space-y-8">{children}</div>
    </Page>
  );
}
