import { Boxes, HandCoins, HeartHandshake, IndianRupee, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BillKindBadge, DebtStatusBadge, MovementBadge, PAYMENT_MODE_LABEL } from "@/components/business/badges";
import { Page, PageHeader } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { salesRepository } from "@/data-access";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/sales/bills/[id]">): Promise<Metadata> {
  const b = await salesRepository.getBill((await params).id);
  return { title: b?.number ?? "Bill" };
}

function Effect({ icon: Icon, label, value, detail, href }: { icon: LucideIcon; label: string; value: string; detail: string; href?: string }) {
  const body = (
    <>
      <Icon className="size-4 text-fg-muted" aria-hidden />
      <div className="mt-2 text-xs text-fg-muted">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-fg-muted">{detail}</div>
    </>
  );
  return href ? (
    <Link href={href} className="block bg-surface p-4 hover:bg-surface-hover">
      {body}
    </Link>
  ) : (
    <div className="bg-surface p-4">{body}</div>
  );
}

export default async function BillPage({ params }: PageProps<"/sales/bills/[id]">) {
  const b = await salesRepository.getBill((await params).id);
  if (!b) notFound();
  const margin = b.net > 0 ? (b.profit / b.net) * 100 : 0;

  return (
    <Page width="narrow">
      <PageHeader
        back={{ href: "/sales/bills", label: "All bills" }}
        eyebrow={`Bill · ${formatDate(b.date)}`}
        title={b.number}
        description={
          b.customerId ? (
            <>
              Billed to{" "}
              <Link href={`/crm/customers/${b.customerId}`} className="font-medium text-fg hover:underline">
                {b.customerName}
              </Link>
            </>
          ) : (
            "Walk-in customer"
          )
        }
        meta={
          <>
            <Badge tone={b.paymentMode === "credit" ? "warning" : "outline"}>{PAYMENT_MODE_LABEL[b.paymentMode]}</Badge>
            <BillKindBadge kind={b.kind} />
            {b.couponCode && <Badge tone="primary">Coupon {b.couponCode}</Badge>}
          </>
        }
      />

      <div className="space-y-6">
        <section aria-label="What this bill affected">
          <h2 className="mb-2 text-sm font-semibold">What this bill affected</h2>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            <Effect icon={Boxes} label="Inventory" value={`−${b.units} units`} detail={`across ${b.items.length} product${b.items.length > 1 ? "s" : ""}`} />
            <Effect icon={IndianRupee} label="Revenue · gross profit" value={formatCurrency(b.net)} detail={`${formatCurrency(b.profit)} profit · ${formatPercent(margin)}`} />
            <Effect icon={HeartHandshake} label="Loyalty" value={b.customerId ? `+${b.pointsEarned} pts` : "—"} detail={b.pointsRedeemed > 0 ? `${b.pointsRedeemed} points redeemed` : b.customerId ? "points earned" : "walk-in, no loyalty"} href={b.customerId ? `/crm/customers/${b.customerId}` : undefined} />
            <Effect
              icon={HandCoins}
              label="Debt"
              value={b.receivable ? formatCurrency(b.receivable.outstanding) : "Paid"}
              detail={b.receivable ? `outstanding of ${formatCurrency(b.receivable.amount)}` : `settled by ${PAYMENT_MODE_LABEL[b.paymentMode]}`}
              href={b.receivable ? "/sales/collections" : undefined}
            />
          </div>
        </section>

        <Card>
          <CardHeader title="Items" actions={b.receivable ? <DebtStatusBadge status={b.receivable.status} /> : undefined} />
          <div className="scrollbar-thin overflow-x-auto border-t border-border-subtle">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-fg-muted">
                  <th scope="col" className="h-8 pl-4 text-left font-medium">Product</th>
                  <th scope="col" className="px-3 text-right font-medium">Qty</th>
                  <th scope="col" className="px-3 text-right font-medium">Price</th>
                  <th scope="col" className="px-3 text-right font-medium">Cost</th>
                  <th scope="col" className="pr-4 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {b.items.map((i) => (
                  <tr key={i.productId} className="border-b border-border-subtle">
                    <td className="py-2.5 pl-4">
                      <Link href={`/inventory/products/${i.productId}`} className="font-medium hover:underline">
                        {i.name}
                      </Link>
                      <div className="flex items-center gap-2 text-2xs text-fg-muted">
                        {i.categoryName} <MovementBadge movement={i.movementNow} compact />
                      </div>
                    </td>
                    <td className="num px-3 text-right">{i.quantity}</td>
                    <td className="num px-3 text-right">{formatCurrency(i.unitPrice)}</td>
                    <td className="num px-3 text-right text-fg-muted">{formatCurrency(i.unitCost)}</td>
                    <td className="num pr-4 text-right font-medium">{formatCurrency(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr>
                  <td colSpan={4} className="pt-3 pl-4 text-right text-fg-muted">Subtotal</td>
                  <td className="num pt-3 pr-4 text-right">{formatCurrency(b.subtotal)}</td>
                </tr>
                {b.couponDiscount > 0 && (
                  <tr>
                    <td colSpan={4} className="pl-4 text-right text-fg-muted">Coupon {b.couponCode}</td>
                    <td className="num pr-4 text-right">−{formatCurrency(b.couponDiscount)}</td>
                  </tr>
                )}
                {b.pointsRedeemed > 0 && (
                  <tr>
                    <td colSpan={4} className="pl-4 text-right text-fg-muted">Loyalty points redeemed</td>
                    <td className="num pr-4 text-right">−{formatCurrency(b.pointsRedeemed)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="pt-1 pb-3 pl-4 text-right font-medium">Total (GST inclusive)</td>
                  <td className="num pt-1 pr-4 pb-3 text-right text-base font-semibold">{formatCurrency(b.net)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
        <p className="text-2xs text-fg-muted">Amounts are GST inclusive. How tax is split on bills is an open question for the backend.</p>
      </div>
    </Page>
  );
}
