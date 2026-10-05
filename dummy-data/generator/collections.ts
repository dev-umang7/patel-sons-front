/** Repayment history and follow-up notes for credit bills. */
import type { CollectionMode, CollectionNote, CollectionPayment, Receivable } from "@/data-access/types/sales";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import type { CustomerSeed } from "../customers";
import type { Rng } from "./random";
import { AS_OF } from "./seasonality";

export function simulateCollections(
  rng: Rng,
  receivables: Receivable[],
  customers: CustomerSeed[],
): { payments: CollectionPayment[]; notes: CollectionNote[] } {
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const payments: CollectionPayment[] = [];
  const notes: CollectionNote[] = [];
  let paySeq = 0;
  let noteSeq = 0;

  for (const r of receivables) {
    const customer = customerById.get(r.customerId)!;
    const mode = (): CollectionMode =>
      customer.type === "business" ? (rng.chance(0.7) ? "bank-transfer" : "cheque") : rng.chance(0.65) ? "upi" : "cash";

    const plan: { date: ISODate; amount: number }[] = [];
    const creditDays = diffDays(r.issuedOn, r.dueOn);
    switch (customer.sim.payment) {
      case "prompt":
        plan.push({ date: addDays(r.issuedOn, rng.int(3, Math.max(4, creditDays))), amount: r.amount });
        break;
      case "late":
        plan.push({ date: addDays(r.dueOn, rng.int(8, 40)), amount: r.amount });
        break;
      case "partial": {
        const first = Math.round((r.amount * rng.range(0.4, 0.6)) / 100) * 100;
        plan.push({ date: addDays(r.dueOn, rng.int(0, 10)), amount: first });
        plan.push({ date: addDays(r.dueOn, rng.int(25, 70)), amount: r.amount - first });
        break;
      }
      case "chronic": {
        const first = Math.round((r.amount * 0.3) / 100) * 100;
        plan.push({ date: addDays(r.dueOn, rng.int(15, 50)), amount: first });
        plan.push({ date: addDays(r.dueOn, rng.int(80, 220)), amount: r.amount - first });
        break;
      }
    }

    let paid = 0;
    for (const step of plan) {
      if (step.date > AS_OF || step.amount <= 0) continue;
      paid += step.amount;
      payments.push({ id: `pay-${String(++paySeq).padStart(4, "0")}`, receivableId: r.id, customerId: r.customerId, date: step.date, amount: step.amount, mode: mode() });
    }

    const outstanding = r.amount - paid;
    if (outstanding <= 0) continue;

    const daysToDue = diffDays(AS_OF, r.dueOn);
    if (daysToDue >= 0 && daysToDue <= 7) {
      notes.push({ id: `cnt-${String(++noteSeq).padStart(4, "0")}`, receivableId: r.id, date: addDays(AS_OF, -1), channel: "message", note: "Sent payment reminder with bill copy." });
      continue;
    }
    if (r.dueOn >= AS_OF) continue;

    const templates: Omit<CollectionNote, "id" | "receivableId" | "date">[] = [
      { channel: "call", note: "Called — asked to send the outstanding statement again." },
      { channel: "message", note: "Shared statement and bill copies." },
      { channel: "call", note: `Spoke to ${customer.name}; promised part payment.`, promisedOn: undefined },
      { channel: "visit", note: "Visited in person; accounts team asked for one more week." },
      { channel: "call", note: "No response. Will follow up again." },
    ];
    let offset = 5;
    for (let i = 0; i < 3; i++) {
      const date = addDays(r.dueOn, offset);
      if (date > AS_OF) break;
      const t = templates[(i + noteSeq) % templates.length];
      const promisedOn = t.channel === "call" && t.note.includes("promised") ? addDays(date, rng.int(5, 15)) : undefined;
      notes.push({ id: `cnt-${String(++noteSeq).padStart(4, "0")}`, receivableId: r.id, date, channel: t.channel, note: t.note, promisedOn });
      offset += rng.int(12, 25);
    }
  }

  return { payments, notes };
}
