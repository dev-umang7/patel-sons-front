import { FlaskConical, Gift } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/charts/bar-list";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Notice } from "@/components/feedback/states";
import { Page, PageHeader, Section } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { inventoryRepository, metaRepository } from "@/data-access";
import { MOVEMENT_RULES } from "@/data-access/rules/assumptions";
import { DecisionTable } from "@/features/inventory/decision-table";
import { formatCurrencyCompact } from "@/lib/format";

export const metadata: Metadata = { title: "Slow-moving inventory" };

export default async function SlowMovingPage() {
  const [all, meta] = await Promise.all([inventoryRepository.listDecisions(), metaRepository.getMeta()]);
  const items = all.filter((i) => (i.movement === "slow" || i.movement === "dead") && i.stockOnHand > 0);
  const tied = items.reduce((a, i) => a + i.stockValue, 0);
  const dead = items.filter((i) => i.movement === "dead");
  const giftable = items.filter((i) => i.giftable);
  const byCategory = new Map<string, { id: string; value: number; count: number }>();
  for (const i of items) {
    const c = byCategory.get(i.categoryName) ?? { id: i.categoryId, value: 0, count: 0 };
    c.value += i.stockValue;
    c.count++;
    byCategory.set(i.categoryName, c);
  }
  const sinceSale = items.map((i) => i.daysSinceLastSale ?? 365).sort((a, b) => a - b);

  return (
    <Page>
      <PageHeader
        eyebrow="Inventory"
        title="Slow-moving & non-fast items"
        description="Which products are not moving, how long they have been sitting, and how much money is tied up — with actions to clear them."
        actions={
          <Button asChild variant="primary">
            <Link href={`/intelligence/gift-selection?include=${giftable.map((g) => g.productId).join(",")}`}>
              <Gift /> Use in gift selection
            </Link>
          </Button>
        }
      />
      <div className="space-y-8">
        <MetricStrip columns={4}>
          <Metric label="Money tied up" value={tied} caption="at average cost" emphasis />
          <Metric label="Slow or dead products" value={items.length} format="number" caption={`${dead.length} dead / very slow`} />
          <Metric label="Median days since last sale" value={sinceSale[Math.floor(sinceSale.length / 2)] ?? 0} format="number" caption="days" />
          <Metric label="Giftable among them" value={giftable.length} format="number" caption={`${formatCurrencyCompact(giftable.reduce((a, i) => a + i.stockValue, 0))} could move via gift bills`} />
        </MetricStrip>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Where it is tied up" description="Slow and dead stock value by category" />
            <CardBody>
              <BarList
                color="var(--status-warning)"
                items={[...byCategory]
                  .sort((a, b) => b[1].value - a[1].value)
                  .map(([name, c]) => ({ key: name, label: name, value: c.value, display: formatCurrencyCompact(c.value), secondary: c.count === 1 ? "1 item" : `${c.count} items`, href: `/inventory/categories/${c.id}` }))}
              />
            </CardBody>
          </Card>
          <div className="space-y-3 lg:col-span-2">
            <Notice tone="info" title="How “slow” and “dead” are calculated">
              From sales in the last {MOVEMENT_RULES.velocityWindowDays} days: slow when current stock covers more than {MOVEMENT_RULES.slowMinCoverDays} days of sales; dead / very slow when nothing sold for {MOVEMENT_RULES.deadNoSaleDays}+ days or stock covers more than {MOVEMENT_RULES.deadMinCoverDays} days. These thresholds are assumptions until management confirms what counts as a “non-fast” item.
            </Notice>
            <Notice tone="intel" icon={FlaskConical} title="Suggested actions are simulated">
              Each product carries a rule-based suggestion — create an offer, include in gift selection, mark for review, replace or eliminate. Open a row to review it; nothing is applied automatically.
            </Notice>
          </div>
        </div>

        <Section title="Non-fast items" description="Select a row to review stock history and act on it">
          <DecisionTable items={items} asOf={meta.asOf} mode="slow" />
        </Section>
      </div>
    </Page>
  );
}
