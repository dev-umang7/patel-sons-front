/**
 * Formatting helpers — Indian conventions (₹, lakh/crore grouping, en-IN dates).
 * All user-visible numbers go through these so presentation stays consistent.
 */

const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const LAKH = 1_00_000;
const CRORE = 1_00_00_000;

/** ₹12,34,567 */
export function formatCurrency(value: number, options?: { precise?: boolean }): string {
  return options?.precise ? inrPrecise.format(value) : inrFull.format(value);
}

/** ₹1.24 Cr · ₹8.6 L · ₹42.5K · ₹950 — for headline figures and chart axes. */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= CRORE) return `${sign}₹${trim(abs / CRORE, 2)} Cr`;
  if (abs >= LAKH) return `${sign}₹${trim(abs / LAKH, abs >= 10 * LAKH ? 1 : 2)} L`;
  if (abs >= 1_000) return `${sign}₹${trim(abs / 1_000, 1)}K`;
  return `${sign}₹${numberFmt.format(abs)}`;
}

/** Axis ticks: compact only where it cannot collapse neighbouring ticks. */
export function formatAxisCurrency(value: number): string {
  return Math.abs(value) >= 10_000 ? formatCurrencyCompact(value) : formatCurrency(Math.round(value));
}

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}

export function formatNumberCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= CRORE) return `${trim(value / CRORE, 2)} Cr`;
  if (abs >= LAKH) return `${trim(value / LAKH, 1)} L`;
  if (abs >= 1_000) return `${trim(value / 1_000, 1)}K`;
  return numberFmt.format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${trim(value, decimals)}%`;
}

/** +8.2% / −3.1% with a true minus sign. */
export function formatSignedPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${trim(Math.abs(value), decimals)}%`;
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${inrFull.format(Math.abs(value))}`;
}

function trim(value: number, decimals: number): string {
  return Number(value.toFixed(decimals)).toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
  });
}

/* ---------- Dates (ISO yyyy-mm-dd strings in, readable strings out) ---------- */

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateShortFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
const monthLongFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

function toDate(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
}

/** 4 Oct 2026 */
export function formatDate(iso: string): string {
  return dateFmt.format(toDate(iso));
}

/** 4 Oct */
export function formatDateShort(iso: string): string {
  return dateShortFmt.format(toDate(iso));
}

/** Oct 26 */
export function formatMonth(isoMonth: string): string {
  return monthFmt.format(toDate(isoMonth.length === 7 ? `${isoMonth}-01` : isoMonth));
}

/** October 2026 */
export function formatMonthLong(isoMonth: string): string {
  return monthLongFmt.format(toDate(isoMonth.length === 7 ? `${isoMonth}-01` : isoMonth));
}

export function formatWeekday(iso: string): string {
  return weekdayFmt.format(toDate(iso));
}

/** "12 days" / "1 day" / "today" */
export function formatDays(days: number): string {
  if (days === 0) return "today";
  const abs = Math.abs(days);
  return `${abs} ${abs === 1 ? "day" : "days"}`;
}

/** Relative to the data's as-of date: "3 days ago", "in 5 days". */
export function formatRelativeDays(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  return days > 0 ? `${days} days ago` : `in ${Math.abs(days)} days`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
