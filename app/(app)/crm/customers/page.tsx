import type { Metadata } from "next";
import { Metric, MetricStrip } from "@/components/data-display/metrics";
import { Page, PageHeader } from "@/components/layout/page";
import { customerRepository } from "@/data-access";
import { CustomersTable } from "@/features/crm/customers-table";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const customers = await customerRepository.listCustomers();
  const active = customers.filter((c) => c.daysSinceLastPurchase !== null && c.daysSinceLastPurchase <= 90);
  const owing = customers.filter((c) => c.outstanding > 0);
  const loyal = customers.filter((c) => c.tierName === "Gold" || c.tierName === "Platinum");
  return (
    <Page>
      <PageHeader eyebrow="CRM" title="Customers" description="Who buys from us, how much, how often — and who owes us. Walk-in sales are not attributed to a customer." />
      <MetricStrip columns={4} className="mb-6">
        <Metric label="Registered customers" value={customers.length} format="number" caption={`${customers.filter((c) => c.type === "business").length} business accounts`} />
        <Metric label="Active in last 90 days" value={active.length} format="number" />
        <Metric label="Gold & Platinum" value={loyal.length} format="number" caption={`${Math.round((loyal.reduce((a, c) => a + c.spend12m, 0) / Math.max(1, customers.reduce((a, c) => a + c.spend12m, 0))) * 100)}% of registered spend`} href="/crm/loyalty" />
        <Metric label="Customers with dues" value={owing.length} format="number" caption={`₹${Math.round(owing.reduce((a, c) => a + c.outstanding, 0)).toLocaleString("en-IN")} outstanding`} href="/sales/collections" />
      </MetricStrip>
      <CustomersTable customers={customers} />
    </Page>
  );
}
