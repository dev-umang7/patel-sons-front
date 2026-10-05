/**
 * Date helpers over ISO date strings (yyyy-mm-dd), always in UTC so results never
 * shift with the viewer's timezone.
 */
export type ISODate = string;
export type ISOMonth = string; // yyyy-mm

const DAY_MS = 86_400_000;

export function parseISODate(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISODate(new Date(parseISODate(iso).getTime() + days * DAY_MS));
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY_MS);
}

export function monthOf(iso: ISODate): ISOMonth {
  return iso.slice(0, 7);
}

export function addMonths(month: ISOMonth, delta: number): ISOMonth {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function startOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(month: ISOMonth): ISODate {
  return addDays(`${addMonths(month, 1)}-01`, -1);
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(iso: ISODate): number {
  return parseISODate(iso).getUTCDay();
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function eachMonth(from: ISODate, to: ISODate): ISOMonth[] {
  const out: ISOMonth[] = [];
  for (let m = monthOf(from); m <= monthOf(to); m = addMonths(m, 1)) out.push(m);
  return out;
}

export function isWithin(iso: ISODate, from: ISODate, to: ISODate): boolean {
  return iso >= from && iso <= to;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}
