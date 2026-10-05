import { z } from "zod";

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Choose a vendor"),
  expectedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an expected date"),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, "Choose a product"),
        quantity: z.coerce.number<number>().int("Whole units only").min(1, "At least 1"),
        unitCost: z.coerce.number<number>().positive("Enter a cost"),
      }),
    )
    .min(1, "Add at least one product"),
  notes: z.string().max(300).optional(),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
