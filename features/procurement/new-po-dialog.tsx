"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Truck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/overlays";
import type { QuoteOption } from "@/data-access/types";
import { addDays } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { createPurchaseOrder } from "./actions";
import { purchaseOrderSchema, type PurchaseOrderInput } from "./schemas";

export function NewPurchaseOrderDialog({ quotes, asOf, initialOpen, initialProductId, initialVendorId }: { quotes: QuoteOption[]; asOf: string; initialOpen?: boolean; initialProductId?: string; initialVendorId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(Boolean(initialOpen));
  const [pending, start] = useTransition();

  const vendors = useMemo(() => [...new Map(quotes.map((q) => [q.vendorId, { id: q.vendorId, name: q.vendorName, lead: q.leadTimeDays }])).values()].sort((a, b) => a.name.localeCompare(b.name)), [quotes]);
  const seed = initialProductId ? (quotes.find((q) => q.productId === initialProductId && q.vendorId === initialVendorId) ?? quotes.find((q) => q.productId === initialProductId && q.isBest)) : undefined;

  const form = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      vendorId: seed?.vendorId ?? "",
      expectedOn: addDays(asOf, seed?.leadTimeDays ?? 5),
      lines: seed ? [{ productId: seed.productId, quantity: Math.max(seed.minOrderQty, seed.reorderLevel * 2 - seed.stockOnHand), unitCost: seed.effectiveCost }] : [],
      notes: "",
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const vendorId = useWatch({ control: form.control, name: "vendorId" });
  const lines = useWatch({ control: form.control, name: "lines" });
  const vendorQuotes = quotes.filter((q) => q.vendorId === vendorId);
  const total = (lines ?? []).reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);
  const { errors } = form.formState;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next && initialOpen) router.replace(pathname, { scroll: false });
  };

  const submit = form.handleSubmit((values) =>
    start(async () => {
      const result = await createPurchaseOrder(values);
      if (result.ok) {
        toast.success(result.message, { description: "Demo mode — validated but not saved yet." });
        close(false);
        form.reset();
      } else toast.error(result.message);
    }),
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Truck /> New purchase order
        </Button>
      </DialogTrigger>
      <DialogContent
        title="New purchase order"
        description="Costs are pre-filled from each vendor's current quote, after live offers."
        className="max-w-2xl"
        footer={
          <>
            <span className="mr-auto text-sm">
              Total <span className="num font-semibold">{formatCurrency(Math.round(total))}</span>
            </span>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="primary" type="submit" form="po-form" disabled={pending}>
              {pending ? "Creating…" : "Create draft"}
            </Button>
          </>
        }
      >
        <form id="po-form" onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor" htmlFor="vendorId" error={errors.vendorId?.message}>
              <NativeSelect
                id="vendorId"
                aria-invalid={!!errors.vendorId}
                {...form.register("vendorId", {
                  onChange: (e) => {
                    const v = vendors.find((x) => x.id === e.target.value);
                    if (v) form.setValue("expectedOn", addDays(asOf, v.lead));
                    form.setValue("lines", []);
                  },
                })}
              >
                <option value="">Select a vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Expected delivery" htmlFor="expectedOn" error={errors.expectedOn?.message}>
              <Input id="expectedOn" type="date" {...form.register("expectedOn")} />
            </Field>
          </div>

          <fieldset className="rounded-lg border border-border">
            <legend className="ml-3 px-1 text-xs font-medium text-fg-secondary">Products</legend>
            {fields.length === 0 ? (
              <p className="px-4 py-4 text-sm text-fg-muted">{vendorId ? "Add products from this vendor's quotes." : "Choose a vendor to see what they supply."}</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {fields.map((field, index) => {
                  const q = vendorQuotes.find((x) => x.productId === lines?.[index]?.productId);
                  return (
                    <li key={field.id} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 sm:grid-cols-[1fr_90px_110px_auto] sm:items-start">
                      <div className="col-span-2 sm:col-span-1">
                        <NativeSelect
                          aria-label="Product"
                          {...form.register(`lines.${index}.productId`, {
                            onChange: (e) => {
                              const picked = vendorQuotes.find((x) => x.productId === e.target.value);
                              if (picked) {
                                form.setValue(`lines.${index}.unitCost`, picked.effectiveCost);
                                form.setValue(`lines.${index}.quantity`, picked.minOrderQty);
                              }
                            },
                          })}
                        >
                          <option value="">Select product…</option>
                          {vendorQuotes.map((x) => (
                            <option key={x.productId} value={x.productId}>
                              {x.productName}
                            </option>
                          ))}
                        </NativeSelect>
                        {q && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-fg-muted">
                            {q.stockOnHand} in stock · min {q.minOrderQty}
                            {q.isBest && <Badge tone="success">Best source</Badge>}
                            {q.offerTitle && <Badge tone="brass">{q.offerTitle}</Badge>}
                          </div>
                        )}
                        {errors.lines?.[index]?.productId && <p className="mt-1 text-xs text-danger">{errors.lines[index]?.productId?.message}</p>}
                      </div>
                      <div>
                        <Input aria-label="Quantity" type="number" inputMode="numeric" aria-invalid={!!errors.lines?.[index]?.quantity} {...form.register(`lines.${index}.quantity`)} />
                        {errors.lines?.[index]?.quantity && <p className="mt-1 text-xs text-danger">{errors.lines[index]?.quantity?.message}</p>}
                      </div>
                      <div>
                        <Input aria-label="Unit cost (₹)" type="number" inputMode="decimal" {...form.register(`lines.${index}.unitCost`)} />
                      </div>
                      <IconButton label="Remove line" size="icon" onClick={() => remove(index)}>
                        <Trash2 />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-t border-border-subtle px-3 py-2">
              <Button size="sm" variant="ghost" disabled={!vendorId} onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}>
                <Plus /> Add product
              </Button>
              {errors.lines?.root?.message || errors.lines?.message ? <span className="ml-2 text-xs text-danger">{errors.lines?.root?.message ?? errors.lines?.message}</span> : null}
            </div>
          </fieldset>

          <Field label="Notes for the vendor (optional)" htmlFor="notes">
            <Textarea id="notes" placeholder="Delivery instructions, offer reference…" {...form.register("notes")} />
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}
