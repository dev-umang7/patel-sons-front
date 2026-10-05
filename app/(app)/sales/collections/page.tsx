import type { Metadata } from "next";
import { BarList } from "@/components/charts/bar-list";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { collectionsRepository, metaRepository } from "@/data-access";
import { COLLECTION_RULES } from "@/data-access/rules/assumptions";
import { ReceivablesTable } from "@/features/sales/receivables-table";
import { formatCurrencyCompact } from "@/lib/format";
import { param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Collection of debt" };

const BUCKET_LABEL = { "not-due": "Not yet due", "1-30": "1–30 days overdue", "31-60": "31–60 days", "61-90": "61–90 days", "90+": "Over 90 days" } as const;

export default async function CollectionsPage({ searchParams }: PageProps<"/sales/collections">) {
  const [overview, receivables, meta] = await Promise.all([collectionsRepository.getOverview(), collectionsRepository.listReceivables({ includePaid: true }), metaRepository.getMeta()]);
  const status = param(await searchParams, "status");
  return (
    <Page>
      <PageHeader eyebrow="Sales" title="Collection of debt" description="What customers owe, how overdue it is, and the next action for each bill. Open a row to record a payment or log a follow-up." />
      <div className="space-y-8">
        <MetricStrip columns={5}>
          <Metric label="Outstanding" value={overview.totalOutstanding} caption={`${overview.customersOwing} customers`} emphasis />
          <Metric label="Overdue" value={overview.overdueAmount} upIsGood={false} />
          <Metric label={`Critical (>${COLLECTION_RULES.criticalOverdueDays} days)`} value={overview.criticalAmount} href="/sales/collections?status=critical" />
          <Metric label={`Due in ${COLLECTION_RULES.dueSoonDays} days`} value={overview.dueSoonAmount} />
          <Metric label="Collected · last 30 days" value={overview.collectedLast30} />
        </MetricStrip>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Ageing" />
            <CardBody>
              <BarList color="var(--status-serious)" items={overview.byBucket.map((b) => ({ key: b.bucket, label: BUCKET_LABEL[b.bucket], value: b.amount, display: formatCurrencyCompact(b.amount), secondary: `${b.count} bills` }))} />
            </CardBody>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="By customer" description="Largest balances first" />
            <CardBody>
              <BarList
                color="var(--chart-1)"
                items={overview.byCustomer.slice(0, 8).map((c) => ({ key: c.customerId, label: c.name, value: c.outstanding, display: formatCurrencyCompact(c.outstanding), secondary: c.overdue > 0 ? `${formatCurrencyCompact(c.overdue)} late` : "on time", href: `/crm/customers/${c.customerId}` }))}
              />
            </CardBody>
          </Card>
        </div>
        <Notice tone="info" title="Status rules (assumptions)">
          Current until the due date; due soon within {COLLECTION_RULES.dueSoonDays} days of it; overdue after it; critical when more than {COLLECTION_RULES.criticalOverdueDays} days overdue. Credit periods come from each customer&apos;s terms. The exact debt-collection workflow is an open question.
        </Notice>
        <Section key={status ?? "all"} title="Outstanding ledger">
          <ReceivablesTable receivables={receivables} asOf={meta.asOf} initialStatus={status} />
        </Section>
      </div>
    </Page>
  );
}
