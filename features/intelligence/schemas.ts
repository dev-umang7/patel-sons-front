import { z } from "zod";

export const giftRequestSchema = z.object({
  occasion: z.enum(["diwali", "wedding", "housewarming", "birthday", "corporate", "anniversary", "pooja"]),
  budgetPerGift: z.coerce.number<number>().min(200, "Budget should be at least ₹200").max(50_000, "Budget looks too high"),
  quantity: z.coerce.number<number>().int().min(1, "At least 1").max(500, "At most 500"),
  categoryIds: z.array(z.string()),
  preferNonFast: z.boolean(),
  customerId: z.string().nullable(),
  boostProductIds: z.array(z.string()).optional(),
});

export type GiftRequestInput = z.infer<typeof giftRequestSchema>;
