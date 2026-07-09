// Date / time helpers. Everything works in LOCAL time and uses
// "YYYY-MM-DD" day keys so days line up with the user's wall clock.

import { WORKDAYS } from "../config";

/** Local day key "YYYY-MM-DD" for a Date. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's local day key. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Parse a "YYYY-MM-DD" key into a local Date at midnight. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "HH:MM" of a Date in local time. */
export function toTimeStr(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Minutes since midnight for "HH:MM". */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes between two "HH:MM" times on the same day (>= 0). */
export function minutesBetween(start: string, end: string): number {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start));
}

/** Is this day key a working day (Mon–Fri)? */
export function isWorkday(key: string): boolean {
  return WORKDAYS.has(parseDateKey(key).getDay());
}

/** Monday of the week containing d (local). */
export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7; // 0 = Monday
  r.setDate(r.getDate() - dow);
  return r;
}

/** Inclusive list of day keys from startKey to endKey. */
export function daysInRange(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  const end = parseDateKey(endKey);
  const cur = parseDateKey(startKey);
  while (cur <= end) {
    out.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * Format a minute count as "H:MM". Negative values keep the sign,
 * e.g. -90 -> "-1:30".
 */
export function fmtDuration(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

/**
 * Signed balance like "+3:30" / "-1:00" / "0:00".
 * With `plusSign = false` the leading "+" is dropped (colour conveys the plus);
 * the "-" for negatives is always kept.
 */
export function fmtSigned(minutes: number, plusSign = true): string {
  const r = Math.round(minutes);
  if (r === 0) return "0:00";
  const sign = r > 0 ? (plusSign ? "+" : "") : "-";
  const abs = Math.abs(r);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

/** Clock time "HH:MM" that is `minutes` after `from`. */
export function clockAfter(from: Date, minutes: number): string {
  const d = new Date(from.getTime() + minutes * 60000);
  return toTimeStr(d);
}

/** Whether the projected end time still falls on the same day as `from`. */
export function isSameDayAfter(from: Date, minutes: number): boolean {
  const d = new Date(from.getTime() + minutes * 60000);
  return toDateKey(d) === toDateKey(from);
}

/** Elapsed "H:MM:SS" for the live timer. */
export function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** e.g. "Thursday, 9 July 2026". */
export function fmtLongDate(key: string): string {
  const d = parseDateKey(key);
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** e.g. "July 2026" for a Date. */
export function fmtMonthYear(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
