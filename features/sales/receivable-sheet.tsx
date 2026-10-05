"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Phone, Users } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DebtStatusBadge } from "@/components/business/badges";
import { KeyValue } from "@/components/data-display/metrics";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/controls";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Meter } from "@/components/ui/misc";
import { Sheet, SheetContent } from "@/components/ui/overlays";
import type { ReceivableView } from "@/data-access/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { logFollowUp, recordPayment } from "./actions";
import { followUpSchema, paymentSchema, type FollowUpInput, type PaymentInput } from "./schemas";

const CHANNEL_ICON = { call: Phone, visit: Users, message: MessageSquare } as const;
const MODE_LABEL = { cash: "Cash", upi: "UPI", cheque: "Cheque", "bank-transfer": "Bank transfer" } as const;

export function ReceivableSheet({ receivable, asOf, onOpenChange }: { receivable: ReceivableView | null; asOf: string; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={receivable !== null} onOpenChange={onOpenChange}>
      {receivable && (
        <SheetContent title={receivable.customerName} description={`${receivable.billNumber} · issued ${formatDate(receivable.issuedOn)}`} className="max-w-lg">
          <Body r={receivable} asOf={asOf} onDone={() => onOpenChange(false)} />
        </SheetContent>
      )}
    </Sheet>
  );
}

function Body({ r, asOf, onDone }: { r: ReceivableView; asOf: string; onDone: () => void }) {
  const paidPct = r.amount > 0 ? (r.paid / r.amount) * 100 : 0;
  return (
    <div className="space-y-5 p-5">
      <div>
        <div className="flex items-center justify-between">
          <DebtStatusBadge status={r.status} />
          <span className="text-xs text-fg-muted">{r.daysOverdue > 0 ? `${r.daysOverdue} days overdue` : `due ${formatDate(r.dueOn)}`}</span>
        </div>
        <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight">{formatCurrency(r.outstanding)}</div>
        <div className="mt-1 text-xs text-fg-muted">
          outstanding of {formatCurrency(r.amount)} · {formatCurrency(r.paid)} paid
        </div>
        <Meter value={paidPct} label="Share of the bill paid" tone="success" className="mt-3" />
      </div>

      <KeyValue
        items={[
          { label: "Bill", value: <Link href={`/sales/bills/${r.billId}`} className="hover:underline">{r.billNumber}</Link> },
          { label: "Due date", value: formatDate(r.dueOn) },
          { label: "Last payment", value: r.lastPaymentOn ? `${formatCurrency(r.lastPaymentAmount ?? 0)} on ${formatDate(r.lastPaymentOn)}` : "None yet" },
          { label: "Next action", value: r.nextAction },
          { label: "Phone", value: <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="hover:underline">{r.phone}</a> },
        ]}
      />

      {r.outstanding > 0 && (
        <Tabs defaultValue="payment">
          <TabsList>
            <TabsTrigger value="payment">Record payment</TabsTrigger>
            <TabsTrigger value="follow-up">Log follow-up</TabsTrigger>
          </TabsList>
          <TabsContent value="payment" className="pt-4">
            <PaymentForm r={r} asOf={asOf} onDone={onDone} />
          </TabsContent>
          <TabsContent value="follow-up" className="pt-4">
            <FollowUpForm r={r} onDone={onDone} />
          </TabsContent>
        </Tabs>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold">Collection history</h3>
        {r.payments.length === 0 && r.notes.length === 0 ? (
          <p className="text-xs text-fg-muted">No payments or follow-ups recorded yet.</p>
        ) : (
          <ol className="space-y-2.5">
            {[
              ...r.payments.map((p) => ({ key: p.id, date: p.date, title: `Paid ${formatCurrency(p.amount)}`, detail: MODE_LABEL[p.mode], icon: null as null | typeof Phone })),
              ...r.notes.map((n) => ({ key: n.id, date: n.date, title: n.note, detail: n.promisedOn ? `Promised by ${formatDate(n.promisedOn)}` : n.channel, icon: CHANNEL_ICON[n.channel] })),
            ]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((e) => (
                <li key={e.key} className="flex gap-2.5 text-sm">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-muted text-fg-muted">{e.icon ? <e.icon className="size-3" /> : <span className="size-1.5 rounded-full bg-success" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block">{e.title}</span>
                    <span className="text-xs text-fg-muted capitalize">
                      {formatDate(e.date)} · {e.detail}
                    </span>
                  </span>
                </li>
              ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function PaymentForm({ r, asOf, onDone }: { r: ReceivableView; asOf: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const form = useForm<PaymentInput>({ resolver: zodResolver(paymentSchema), defaultValues: { receivableId: r.id, amount: r.outstanding, date: asOf, mode: r.customerType === "business" ? "bank-transfer" : "upi", reference: "" } });
  const { errors } = form.formState;
  const submit = form.handleSubmit((v) =>
    start(async () => {
      const res = await recordPayment(v, r.outstanding);
      if (res.ok) {
        toast.success(res.message, { description: "Demo mode — validated but not saved yet." });
        onDone();
      } else form.setError("amount", { message: res.message });
    }),
  );
  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <Field label="Amount (₹)" htmlFor="pay-amount" error={errors.amount?.message}>
        <Input id="pay-amount" type="number" inputMode="decimal" aria-invalid={!!errors.amount} {...form.register("amount")} />
      </Field>
      <Field label="Received on" htmlFor="pay-date" error={errors.date?.message}>
        <Input id="pay-date" type="date" {...form.register("date")} />
      </Field>
      <Field label="Mode" htmlFor="pay-mode">
        <NativeSelect id="pay-mode" {...form.register("mode")}>
          {Object.entries(MODE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Reference (optional)" htmlFor="pay-ref">
        <Input id="pay-ref" placeholder="UTR / cheque no." {...form.register("reference")} />
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Recording…" : "Record payment"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => form.setValue("amount", r.outstanding)}>
          Full balance
        </Button>
      </div>
    </form>
  );
}

function FollowUpForm({ r, onDone }: { r: ReceivableView; onDone: () => void }) {
  const [pending, start] = useTransition();
  const form = useForm<FollowUpInput>({ resolver: zodResolver(followUpSchema), defaultValues: { receivableId: r.id, channel: "call", note: "", promisedOn: "" } });
  const { errors } = form.formState;
  const submit = form.handleSubmit((v) =>
    start(async () => {
      const res = await logFollowUp(v);
      if (res.ok) {
        toast.success(res.message, { description: "Demo mode — validated but not saved yet." });
        onDone();
      } else toast.error(res.message);
    }),
  );
  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <Field label="How" htmlFor="fu-channel">
        <NativeSelect id="fu-channel" {...form.register("channel")}>
          <option value="call">Phone call</option>
          <option value="visit">Visit</option>
          <option value="message">Message</option>
        </NativeSelect>
      </Field>
      <Field label="Promised payment by (optional)" htmlFor="fu-promise">
        <Input id="fu-promise" type="date" {...form.register("promisedOn")} />
      </Field>
      <Field label="Note" htmlFor="fu-note" error={errors.note?.message} className="sm:col-span-2">
        <Textarea id="fu-note" aria-invalid={!!errors.note} placeholder="What was agreed?" {...form.register("note")} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>
          Log follow-up
        </Button>
      </div>
    </form>
  );
}
