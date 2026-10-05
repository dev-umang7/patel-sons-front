import type { ID, ISODate } from "./common";

export type ExpenseCategory =
  | "rent"
  | "salaries"
  | "utilities"
  | "freight"
  | "marketing"
  | "packaging"
  | "maintenance"
  | "bank-charges"
  | "miscellaneous";

export interface Expense {
  id: ID;
  date: ISODate;
  category: ExpenseCategory;
  amount: number;
  description: string;
  payee: string;
  /** Optional allocation to a product category. Allocation policy is an OPEN QUESTION. */
  productCategoryId?: ID;
  /** Optional link, e.g. inward freight for a purchase. */
  purchaseId?: ID;
}
