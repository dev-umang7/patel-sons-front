import { ArrowRight, Boxes, Receipt, ShoppingBag, TrendingUp, Truck, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Delta } from "@/components/data-display/metrics";
import { PeriodPicker } from "@/components/forms/period-picker";
import { Page, PageHeader } from "@/components/layout/page";
import { reportRepository } from "@/data-access";
import { loadReportContext } from "@/features/reports/load";
import { formatCurrencyCompact, formatPercent } from "@/lib/format";
import { periodSearchParams } from "@/lib/period";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsHubPage({ searchParams }: PageProps<"/reports">) {
  const { meta, period, reportPeriod } = await loadReportContext(await searchParams, "fytd");
  const [profit, purchases, expenses] = await Promise.all([reportRepository.getProfitReport(reportPeriod), reportRepository.getPurchaseReport(reportPeriod), reportRepository.getExpenseReport(reportPeriod)]);
  const t = profit.totals;
  const p = profit.previous;
  const top = profit.byCategory[0];
  const qs = periodSearchParams(period);

  const reports: { href: string; icon: LucideIcon; title: string; question: string; value: string; delta?: { current: number; previous: number; upIsGood?: boolean }; detail: string }[] = [
    { href: "/reports/profit", icon: TrendingUp, title: "Profit", question: "How profitable are we?", value: formatCurrencyCompact(t.netProfit), delta: { current: t.netProfit, previous: p.netProfit }, detail: `net · ${formatPercent(t.grossMarginPercent)} gross margin` },
    { href: "/reports/sales", icon: ShoppingBag, title: "Sales", question: "How much are we selling?", value: formatCurrencyCompact(t.revenue), delta: { current: t.revenue, previous: p.revenue }, detail: `${t.bills.toLocaleString("en-IN")} bills · ${t.units.toLocaleString("en-IN")} units` },
    { href: "/reports/purchases", icon: Truck, title: "Purchases", question: "How much are we purchasing?", value: formatCurrencyCompact(purchases.total), delta: { current: purchases.total, previous: purchases.previousTotal, upIsGood: false }, detail: `${purchases.orders} purchases · ${formatCurrencyCompact(purchases.savings)} saved via offers` },
    { href: "/reports/categories", icon: Boxes, title: "Category-wise", question: "Which categories perform best?", value: top?.name ?? "—", detail: top ? `${formatCurrencyCompact(top.revenue)} sales · ${formatPercent(top.marginPercent)} margin` : "" },
    { href: "/reports/expenses", icon: Receipt, title: "Expenses", question: "What are our expenses?", value: formatCurrencyCompact(expenses.total), delta: { current: expenses.total, previous: expenses.previousTotal, upIsGood: false }, detail: `${formatPercent(expenses.revenue ? (expenses.total / expenses.revenue) * 100 : 0)} of sales · largest: ${expenses.byCategory[0]?.label ?? "—"}` },
  ];

  return (
    <Page>
      <PageHeader eyebrow="Analytics" title="Management reports" description="Each report answers one question and shares the same period and filters. Figures below are for the selected period." actions={<PeriodPicker period={period} asOf={meta.asOf} historyStart={meta.historyStart} />} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <Link key={r.href} href={`${r.href}?${qs}`} className="group flex flex-col rounded-lg border border-border bg-surface p-5 shadow-xs transition-colors hover:border-border-strong">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-md bg-primary-soft text-primary-soft-fg">
                <r.icon className="size-4" aria-hidden />
              </span>
              <ArrowRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
            </div>
            <h2 className="mt-4 text-base font-semibold">{r.title}</h2>
            <p className="text-xs text-fg-muted">{r.question}</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">{r.value}</span>
              {r.delta && <Delta {...r.delta} />}
            </div>
            <p className="mt-1 text-xs text-fg-muted">{r.detail}</p>
          </Link>
        ))}
        <div className="flex flex-col justify-center rounded-lg border border-dashed border-border-strong p-5 text-sm text-fg-muted">
          <span className="font-medium text-fg">Exports</span>
          Every report can export its main table as CSV. Scheduled and PDF reports can be added once the backend exists.
        </div>
      </div>
    </Page>
  );
}
