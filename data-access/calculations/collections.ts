import { diffDays, type ISODate } from "@/lib/dates";
import { COLLECTION_RULES } from "../rules/assumptions";

export type ReceivableStatus = "paid" | "current" | "due-soon" | "overdue" | "critical";

export type AgeingBucket = "not-due" | "1-30" | "31-60" | "61-90" | "90+";

export const AGEING_BUCKETS: AgeingBucket[] = ["not-due", "1-30", "31-60", "61-90", "90+"];

/** CALCULATED from due date and balance. Thresholds are ASSUMPTIONS. */
export function receivableStatus(outstanding: number, dueOn: ISODate, asOf: ISODate): ReceivableStatus {
  if (outstanding <= 0) return "paid";
  const overdue = diffDays(dueOn, asOf);
  if (overdue > COLLECTION_RULES.criticalOverdueDays) return "critical";
  if (overdue > 0) return "overdue";
  if (-overdue <= COLLECTION_RULES.dueSoonDays) return "due-soon";
  return "current";
}

export function ageingBucket(daysOverdue: number): AgeingBucket {
  if (daysOverdue <= 0) return "not-due";
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

export const RECEIVABLE_STATUS_ORDER: Record<ReceivableStatus, number> = {
  critical: 0,
  overdue: 1,
  "due-soon": 2,
  current: 3,
  paid: 4,
};
