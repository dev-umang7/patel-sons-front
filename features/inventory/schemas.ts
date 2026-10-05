import { z } from "zod";

export const clearanceOfferSchema = z
  .object({
    productId: z.string().min(1),
    discountPercent: z.coerce.number<number>().min(1, "At least 1%").max(60, "Keep it at or below 60%"),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date"),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date"),
    channel: z.enum(["shelf", "gift-bills", "both"]),
    note: z.string().max(240).optional(),
  })
  .refine((v) => v.endsOn >= v.startsOn, { path: ["endsOn"], message: "End date must be on or after the start date" });

export type ClearanceOfferInput = z.infer<typeof clearanceOfferSchema>;

export const decisionSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1),
  decision: z.enum(["keep", "review", "replace", "eliminate"]),
  note: z.string().max(240).optional(),
});

export type DecisionInput = z.infer<typeof decisionSchema>;

export interface ActionResult {
  ok: boolean;
  message: string;
  /** True while running on dummy data: the action is validated but not stored. */
  demo: boolean;
}
