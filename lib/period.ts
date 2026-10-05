/**
 * Reporting periods, resolved against the data's as-of date (not the wall clock)
 * so figures stay meaningful for static data. Periods live in the URL
 * (?period=30d or ?from=…&to=…) so every view is linkable and server-rendered.
 */
import { addDays, diffDays, type ISODate } from "./dates";

export const PERIOD_PRESETS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "fytd", label: "Financial year to date" },
  { key: "12m", label: "Last 12 months" },
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]["key"];
export type Granularity = "day" | "week" | "month";

export interface ResolvedPeriod {
  key: PeriodPreset | "custom";
  label: string;
  from: ISODate;
  to: ISODate;
  days: number;
  previous: { from: ISODate; to: ISODate };
  granularity: Granularity;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function isPreset(value: string | undefined): value is PeriodPreset {
  return PERIOD_PRESETS.some((p) => p.key === value);
}

export function resolvePeriod(
  params: { period?: string; from?: string; to?: string },
  asOf: ISODate,
  fallback: PeriodPreset = "30d",
): ResolvedPeriod {
  if (params.from && params.to && ISO.test(params.from) && ISO.test(params.to) && params.from <= params.to) {
    return build("custom", "Custom range", params.from, params.to <= asOf ? params.to : asOf);
  }
  const key = isPreset(params.period) ? params.period : fallback;
  const label = PERIOD_PRESETS.find((p) => p.key === key)!.label;
  switch (key) {
    case "7d":
      return build(key, label, addDays(asOf, -6), asOf);
    case "30d":
      return build(key, label, addDays(asOf, -29), asOf);
    case "90d":
      return build(key, label, addDays(asOf, -89), asOf);
    case "12m":
      return build(key, label, addDays(asOf, -364), asOf);
    case "fytd": {
      const y = Number(asOf.slice(0, 4));
      const start = Number(asOf.slice(5, 7)) >= 4 ? `${y}-04-01` : `${y - 1}-04-01`;
      return build(key, label, start, asOf);
    }
  }
}

function build(key: ResolvedPeriod["key"], label: string, from: ISODate, to: ISODate): ResolvedPeriod {
  const days = diffDays(from, to) + 1;
  const prevTo = addDays(from, -1);
  return {
    key,
    label,
    from,
    to,
    days,
    previous: { from: addDays(prevTo, -(days - 1)), to: prevTo },
    granularity: days <= 31 ? "day" : days <= 120 ? "week" : "month",
  };
}

/** Bucket key for a date at a granularity (weeks start Monday). */
export function bucketOf(date: ISODate, granularity: Granularity): string {
  if (granularity === "day") return date;
  if (granularity === "month") return date.slice(0, 7);
  const d = new Date(`${date}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(date, -offset);
}

export function periodSearchParams(period: ResolvedPeriod): string {
  return period.key === "custom" ? `from=${period.from}&to=${period.to}` : `period=${period.key}`;
}
