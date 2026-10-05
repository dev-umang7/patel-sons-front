/**
 * Demand shaping for the simulation: festivals, seasons, weekdays and product
 * life-cycle trends. Generator-only — nothing here is a business rule.
 */
import { diffDays, isWithin, type ISODate } from "@/lib/dates";
import type { DemandSeason, DemandTrend } from "../catalog";

export const HISTORY_START: ISODate = "2025-10-01";
export const AS_OF: ISODate = "2026-09-30";

const DHANTERAS_2025: ISODate = "2025-10-18";

const WEEKDAY_FACTOR = [1.35, 0.85, 0.9, 0.9, 0.95, 1.05, 1.2];

/** Store-wide footfall multiplier. */
export function trafficFactor(date: ISODate, weekday: number): number {
  let f = WEEKDAY_FACTOR[weekday];
  if (isWithin(date, "2025-10-08", "2025-10-21")) {
    const toPeak = Math.abs(diffDays(date, DHANTERAS_2025));
    f *= 1.4 + Math.max(0, 2.2 - toPeak * 0.28);
  }
  if (isWithin(date, "2025-10-22", "2025-10-26")) f *= 0.6; // post-Diwali lull
  if (isWithin(date, "2026-07-01", "2026-08-31")) f *= 0.85; // monsoon
  if (isWithin(date, "2026-09-20", "2026-09-30")) f *= 1.12; // pre-Navratri
  if (isWithin(date, "2026-01-13", "2026-01-15")) f *= 1.3; // Uttarayan
  if (isWithin(date, "2026-04-18", "2026-04-20")) f *= 1.35; // Akshaya Tritiya
  return f;
}

export function seasonFactor(season: DemandSeason | undefined, date: ISODate): number {
  if (!season) return 1;
  const md = date.slice(5);
  switch (season) {
    case "diwali":
      if (isWithin(date, "2025-10-05", "2025-10-21")) return 5.5;
      if (isWithin(date, "2026-09-18", "2026-09-30")) return 1.6;
      return 0.55;
    case "winter":
      if (md >= "11-15" || md <= "01-31") return md >= "12-01" || md <= "01-20" ? 4.2 : 2.6;
      if (md >= "02-01" && md <= "02-20") return 0.8;
      return 0.08;
    case "summer":
      if (md >= "03-15" && md <= "06-15") return 2.6;
      if (md >= "02-10" && md < "03-15") return 1.3;
      if (md > "06-15" && md <= "09-30") return 0.55;
      return 0.25;
    case "wedding":
      if (md >= "11-15" || md <= "02-28") return 1.7;
      if (md >= "04-15" && md <= "05-31") return 1.35;
      return 0.85;
  }
}

/** Life-cycle shape across the history window (t = days since history start). */
export function trendFactor(trend: DemandTrend | undefined, t: number): number {
  const span = diffDays(HISTORY_START, AS_OF);
  const x = t / span;
  switch (trend) {
    case "declining":
      return 1.5 - x * 1.15;
    case "fading":
      return 1.8 * Math.exp(-t / 55);
    case "rising":
      return 0.55 + x * 1.2;
    default:
      return 1;
  }
}
