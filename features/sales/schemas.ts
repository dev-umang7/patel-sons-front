import { z } from "zod";

export const paymentSchema = z.object({
  receivableId: z.string().min(1),
  amount: z.coerce.number<number>().positive("Enter an amount"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  mode: z.enum(["cash", "upi", "cheque", "bank-transfer"]),
  reference: z.string().max(60).optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const followUpSchema = z.object({
  receivableId: z.string().min(1),
  channel: z.enum(["call", "visit", "message"]),
  note: z.string().min(3, "Add a short note").max(240),
  promisedOn: z.string().optional(),
});

export type FollowUpInput = z.infer<typeof followUpSchema>;
