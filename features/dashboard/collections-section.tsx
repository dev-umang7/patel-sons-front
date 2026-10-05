import Link from "next/link";
import { BarList } from "@/components/charts/bar-list";
import { DebtStatusBadge } from "@/components/business/badges";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { CollectionsOverview } from "@/data-access/types";
import { formatCurrencyCompact, formatDateShort } from "@/lib/format";

const BUCKET_LABEL = { "not-due": "Not yet due", "1-30": "1–30 days overdue", "31-60": "31–60 days", "61-90": "61–90 days", "90+": "Over 90 days" } as const;

export function CollectionsSection({ overview }: { overview: CollectionsOverview }) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader title="Debt ageing" description={`${formatCurrencyCompact(overview.collectedLast30)} collected in the last 30 days`} />
        <CardBody>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-semibold tracking-tight">{formatCurrencyCompact(overview.totalOutstanding)}</span>
            <span className="text-xs text-fg-muted">outstanding · {formatCurrencyCompact(overview.overdueAmount)} overdue</span>
          </div>
          <BarList
            color="var(--status-serious)"
            items={overview.byBucket.map((b) => ({ key: b.bucket, label: BUCKET_LABEL[b.bucket], value: b.amount, display: formatCurrencyCompact(b.amount), secondary: `${b.count} bills` }))}
          />
        </CardBody>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader title="Who owes us" description="Customers with outstanding credit bills" actions={<Button asChild variant="ghost" size="sm"><Link href="/sales/collections">Collection of debt</Link></Button>} />
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {overview.byCustomer.slice(0, 6).map((c) => (
            <li key={c.customerId}>
              <Link href={`/crm/customers/${c.customerId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{c.name}</span>
                  <span className="text-xs text-fg-muted">
                    {c.receivables} open bill{c.receivables > 1 ? "s" : ""} · oldest due {formatDateShort(c.oldestDueOn)}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="num text-sm font-medium">{formatCurrencyCompact(c.outstanding)}</span>
                  <DebtStatusBadge status={c.worstStatus} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
