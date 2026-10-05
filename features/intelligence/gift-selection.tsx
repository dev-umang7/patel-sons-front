"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, FlaskConical, Gift, PackageCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { MovementBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { ProvenanceTag } from "@/components/business/provenance";
import { EmptyState, Notice } from "@/components/feedback/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Switch } from "@/components/ui/controls";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/misc";
import type { GiftRecommendation } from "@/data-access/types";
import { formatCurrency, formatPercent } from "@/lib/format";
import { listContainer, listItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createGiftBillDraft, getGiftRecommendations } from "./actions";
import { giftRequestSchema, type GiftRequestInput } from "./schemas";

const OCCASIONS = [
  { value: "diwali", label: "Diwali" },
  { value: "wedding", label: "Wedding" },
  { value: "housewarming", label: "Housewarming" },
  { value: "corporate", label: "Corporate gifting" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "pooja", label: "Pooja" },
] as const;

const SUITABILITY = { excellent: "success", good: "info", fair: "neutral" } as const;

export function GiftSelection({ categories, customers, boostProductIds }: { categories: { id: string; name: string }[]; customers: { id: string; name: string }[]; boostProductIds: string[] }) {
  const [result, setResult] = useState<GiftRecommendation | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const form = useForm<GiftRequestInput>({
    resolver: zodResolver(giftRequestSchema),
    defaultValues: { occasion: "diwali", budgetPerGift: 1500, quantity: 10, categoryIds: [], preferNonFast: true, customerId: null, boostProductIds },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((values) =>
    start(async () => {
      const res = await getGiftRecommendations(values);
      if (res.ok) {
        setResult(res.result);
        setPicked([]);
      } else toast.error(res.message);
    }),
  );

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const quantity = useWatch({ control: form.control, name: "quantity" });

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card className="h-fit p-5 lg:sticky lg:top-20">
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Gift brief</h2>
            <ProvenanceTag kind="simulated" />
          </div>
          <Field label="Occasion" htmlFor="occasion">
            <NativeSelect id="occasion" {...form.register("occasion")}>
              {OCCASIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget per gift (₹)" htmlFor="budget" error={errors.budgetPerGift?.message}>
              <Input id="budget" type="number" inputMode="numeric" aria-invalid={!!errors.budgetPerGift} {...form.register("budgetPerGift")} />
            </Field>
            <Field label="How many gifts" htmlFor="quantity" error={errors.quantity?.message}>
              <Input id="quantity" type="number" inputMode="numeric" aria-invalid={!!errors.quantity} {...form.register("quantity")} />
            </Field>
          </div>
          <Field label="For customer (optional)" htmlFor="customer" hint="Avoids products they already own.">
            <Controller
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <NativeSelect id="customer" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)}>
                  <option value="">Any customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            />
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-fg-secondary">Categories (optional)</legend>
            <Controller
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => {
                    const on = field.value.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => field.onChange(on ? field.value.filter((x) => x !== c.id) : [...field.value, c.id])}
                        className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors", on ? "border-primary bg-primary-soft text-primary-soft-fg" : "border-border text-fg-secondary hover:border-border-strong")}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </fieldset>
          <Controller
            control={form.control}
            name="preferNonFast"
            render={({ field }) => (
              <label className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface-muted p-3">
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Prefer non-fast items" className="mt-0.5" />
                <span className="text-xs">
                  <span className="block font-medium text-fg">Prefer non-fast items</span>
                  <span className="text-fg-muted">Moves slow stock through gift bills, as in the source notes.</span>
                </span>
              </label>
            )}
          />
          {boostProductIds.length > 0 && (
            <p className="text-xs text-fg-muted">
              <PackageCheck className="mr-1 inline size-3.5 text-brass" />
              {boostProductIds.length} product{boostProductIds.length > 1 ? "s" : ""} sent from inventory will be ranked higher.
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            <Sparkles /> {pending ? "Selecting…" : "Suggest gifts"}
          </Button>
        </form>
      </Card>

      <div className="min-w-0 space-y-6">
        {pending && !result ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-24" />
                <Skeleton className="mt-4 h-12 w-full" />
              </Card>
            ))}
          </div>
        ) : !result ? (
          <Card>
            <EmptyState icon={Gift} title="Describe the gift to get suggestions" description="Set an occasion, a budget per gift and how many you need. Suggestions only include products that are in stock." />
          </Card>
        ) : result.suggestions.length === 0 ? (
          <Card>
            <EmptyState title="Nothing fits this brief" description="No in-stock product matches the budget and categories. Try a higher budget or clear the category filter." />
          </Card>
        ) : (
          <>
            <div className={cn("flex flex-wrap items-center justify-between gap-3 transition-opacity", pending && "opacity-60")}>
              <p className="text-sm text-fg-secondary">
                {result.suggestions.length} suggestions from {result.consideredCount} in-stock products
              </p>
              <Button
                variant="primary"
                size="sm"
                disabled={picked.length === 0}
                onClick={async () => {
                  const r = await createGiftBillDraft(picked, quantity);
                  toast.success(r.message, { description: "Demo mode — the Gift Bills rule is still an open question." });
                }}
              >
                <Gift /> Prepare gift bill ({picked.length})
              </Button>
            </div>

            <motion.ul variants={listContainer} initial="initial" animate="enter" className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", pending && "opacity-60")}>
              {result.suggestions.map((s) => {
                const on = picked.includes(s.productId);
                return (
                  <motion.li key={s.productId} variants={listItem}>
                    <Card className={cn("flex h-full flex-col p-4 transition-colors", on && "border-primary ring-1 ring-primary")}>
                      <div className="flex items-start gap-3">
                        <ProductThumb categoryName={s.categoryName} size="md" />
                        <div className="min-w-0 flex-1">
                          <Link href={`/inventory/products/${s.productId}`} className="line-clamp-2 text-sm font-medium hover:underline">
                            {s.name}
                          </Link>
                          <div className="text-xs text-fg-muted">{s.brandName}</div>
                        </div>
                        <Checkbox checked={on} onCheckedChange={() => toggle(s.productId)} aria-label={`Select ${s.name}`} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="num text-base font-semibold">{formatCurrency(s.price)}</span>
                        <Badge tone={SUITABILITY[s.suitability]} className="capitalize">
                          {s.suitability} fit
                        </Badge>
                        {(s.movement === "slow" || s.movement === "dead") && <MovementBadge movement={s.movement} compact />}
                      </div>
                      <ul className="mt-3 flex-1 space-y-1">
                        {s.reasons.map((r) => (
                          <li key={r} className="flex gap-1.5 text-xs text-fg-secondary">
                            <Check className="mt-0.5 size-3 shrink-0 text-intel" aria-hidden /> {r}
                          </li>
                        ))}
                      </ul>
                      <div className={cn("mt-3 border-t border-border-subtle pt-2 text-2xs", s.enoughStock ? "text-fg-muted" : "text-danger")}>
                        {s.stockOnHand} in stock · margin {formatPercent(s.marginPercent, 0)}
                      </div>
                    </Card>
                  </motion.li>
                );
              })}
            </motion.ul>

            <AnimatePresence>
              {result.combinations.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} aria-labelledby="combos">
                  <h3 id="combos" className="mb-2 text-sm font-semibold">
                    Suggested combinations
                  </h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {result.combinations.map((c) => (
                      <Card key={c.productIds.join("-")} className="p-4">
                        <div className="num text-lg font-semibold">{formatCurrency(c.total)}</div>
                        <div className="text-xs text-fg-muted">{c.withinBudget ? "within budget" : "slightly over budget"} · {c.reason}</div>
                        <ul className="mt-2 space-y-0.5 text-sm">
                          {c.names.map((n) => (
                            <li key={n} className="truncate">
                              + {n}
                            </li>
                          ))}
                        </ul>
                        <Button size="xs" className="mt-3" onClick={() => setPicked(c.productIds)}>
                          Use this combination
                        </Button>
                      </Card>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <Notice tone="intel" icon={FlaskConical} title="About these suggestions">
              {result.notes.join(" ")} This is a simulated selection over demo data — no external AI service is called.
            </Notice>
          </>
        )}
      </div>
    </div>
  );
}
