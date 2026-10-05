"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Flag, Gift, Percent, Repeat } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/overlays";
import type { DecisionRecommendation, SlowMovingAction } from "@/data-access/types";
import { addDays } from "@/lib/dates";
import { createClearanceOffer, recordDecision } from "./actions";
import { clearanceOfferSchema, type ActionResult, type ClearanceOfferInput } from "./schemas";

function report(result: ActionResult) {
  if (result.ok) toast.success(result.message, { description: result.demo ? "Demo mode — validated but not saved yet." : undefined });
  else toast.error(result.message);
}

export function DecisionActions({
  productId,
  productName,
  actions,
  replacement,
  asOf,
  size = "sm",
}: {
  productId: string;
  productName: string;
  actions: SlowMovingAction[];
  replacement?: DecisionRecommendation["replacement"];
  asOf: string;
  size?: "xs" | "sm";
}) {
  const [pending, start] = useTransition();
  const decide = (decision: "review" | "replace" | "eliminate", note?: string) =>
    start(async () => report(await recordDecision({ productIds: [productId], decision, note })));

  return (
    <>
      {actions.includes("create-offer") && <OfferDialog productId={productId} productName={productName} asOf={asOf} size={size} />}
      {actions.includes("gift-selection") && (
        <Button asChild size={size}>
          <Link href={`/intelligence/gift-selection?include=${productId}`}>
            <Gift /> Gift selection
          </Link>
        </Button>
      )}
      {actions.includes("mark-review") && (
        <Button size={size} disabled={pending} onClick={() => decide("review")}>
          <Flag /> Mark for review
        </Button>
      )}
      {actions.includes("replace") && (
        <ConfirmDialog
          trigger={
            <Button size={size}>
              <Repeat /> Replace
            </Button>
          }
          title={`Replace ${productName}?`}
          description={replacement ? `Stop re-ordering this line and consider ${replacement.name} instead (${replacement.reason}).` : "Stop re-ordering this line and source an alternative."}
          confirmLabel="Mark for replacement"
          onConfirm={(note) => decide("replace", note)}
        />
      )}
      {actions.includes("eliminate") && (
        <ConfirmDialog
          trigger={
            <Button size={size} variant="ghost" className="text-danger hover:text-danger">
              <Ban /> Eliminate
            </Button>
          }
          title={`Eliminate ${productName}?`}
          description="The product will be flagged to stop re-ordering. Remaining stock should be cleared through an offer or gift bills. You can reverse this later."
          confirmLabel="Mark for elimination"
          destructive
          onConfirm={(note) => decide("eliminate", note)}
        />
      )}
    </>
  );
}

function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (note?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={title}
        description={description}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant={destructive ? "danger" : "primary"}
              onClick={() => {
                onConfirm(note || undefined);
                setOpen(false);
                setNote("");
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <Field label="Note for the team (optional)" htmlFor="decision-note">
          <Textarea id="decision-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this decision?" maxLength={240} />
        </Field>
      </DialogContent>
    </Dialog>
  );
}

function OfferDialog({ productId, productName, asOf, size }: { productId: string; productName: string; asOf: string; size: "xs" | "sm" }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const form = useForm<ClearanceOfferInput>({
    resolver: zodResolver(clearanceOfferSchema),
    defaultValues: { productId, discountPercent: 15, startsOn: addDays(asOf, 1), endsOn: addDays(asOf, 21), channel: "both", note: "" },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((values) =>
    start(async () => {
      const result = await createClearanceOffer(values);
      report(result);
      if (result.ok) {
        setOpen(false);
        form.reset();
      }
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant="primary">
          <Percent /> Create offer
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Create clearance offer"
        description={productName}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="primary" type="submit" form="offer-form" disabled={pending}>
              {pending ? "Scheduling…" : "Schedule offer"}
            </Button>
          </>
        }
      >
        <form id="offer-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Discount %" htmlFor="discountPercent" error={errors.discountPercent?.message}>
            <Input id="discountPercent" type="number" inputMode="numeric" aria-invalid={!!errors.discountPercent} {...form.register("discountPercent")} />
          </Field>
          <Field label="Applies to" htmlFor="channel" hint="How offers combine with gift bills is an open question.">
            <NativeSelect id="channel" {...form.register("channel")}>
              <option value="both">Shelf & gift bills</option>
              <option value="shelf">Shelf only</option>
              <option value="gift-bills">Gift bills only</option>
            </NativeSelect>
          </Field>
          <Field label="Starts" htmlFor="startsOn" error={errors.startsOn?.message}>
            <Input id="startsOn" type="date" aria-invalid={!!errors.startsOn} {...form.register("startsOn")} />
          </Field>
          <Field label="Ends" htmlFor="endsOn" error={errors.endsOn?.message}>
            <Input id="endsOn" type="date" aria-invalid={!!errors.endsOn} {...form.register("endsOn")} />
          </Field>
          <Field label="Note (optional)" htmlFor="note" className="sm:col-span-2">
            <Textarea id="note" placeholder="e.g. Display near billing counter" {...form.register("note")} />
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}
