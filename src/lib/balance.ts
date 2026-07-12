// The core accounting: how tracked time turns into an over-/undertime balance.
//
// Rules (confirmed with the user):
//  - Target is 8 h on Mon–Fri, 0 h on Sat/Sun.
//  - A PAST working day with no entries counts as -8 h.
//  - TODAY counts only once something is tracked (7 h -> -1 h); empty today = 0.
//  - Vacation / holiday / sick mark a whole day as fulfilled (balance 0).
//  - Time tracked on a weekend / absence day still counts as a plus.

import { DAILY_TARGET_MINUTES as DAILY } from "../config";
import type { AbsenceType, DayMark, Entry, RangeKey, RunningSession } from "../types";
import {
  isWorkday,
  minutesBetween,
  parseDateKey,
  startOfWeek,
  timeToMinutes,
  toDateKey,
  toTimeStr,
  todayKey,
  daysInRange,
} from "./time";

export type DayState =
  | "met" // working day target reached
  | "under" // past working day below target
  | "progress" // today/future working day, tracked but below target
  | "absence" // vacation / holiday / sick
  | "weekend-work" // tracked time on a non-working day
  | "empty"; // nothing relevant to show

export interface DayInfo {
  key: string;
  worked: number; // tracked minutes (incl. running timer if applicable)
  balance: number; // contribution to the account
  state: DayState;
  mark?: AbsenceType;
}

export interface RangeSummary {
  worked: number;
  target: number; // effective target that was actually counted
  balance: number;
}

/** Sum tracked minutes per day key, including the running timer if given. */
export function workedByDay(
  entries: Entry[],
  running: RunningSession | null,
  now: Date,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.date, (map.get(e.date) ?? 0) + minutesBetween(e.start, e.end));
  }
  if (running) {
    const started = new Date(running.startedAt);
    const key = toDateKey(started);
    const elapsed = Math.floor((now.getTime() - started.getTime()) / 60000);
    // Never let a forgotten timer bleed past midnight into its start day.
    const capToDayEnd = 24 * 60 - timeToMinutes(toTimeStr(started));
    const mins = Math.max(0, Math.min(elapsed, capToDayEnd));
    map.set(key, (map.get(key) ?? 0) + mins);
  }
  return map;
}

export function marksByDay(marks: DayMark[]): Map<string, AbsenceType> {
  const map = new Map<string, AbsenceType>();
  for (const m of marks) map.set(m.date, m.type);
  return map;
}

/** Everything needed to render and account for a single day. */
export function dayInfo(
  key: string,
  worked: number,
  mark: AbsenceType | undefined,
  tKey: string,
): DayInfo {
  if (mark) {
    return { key, worked, balance: 0, state: "absence", mark };
  }
  if (!isWorkday(key)) {
    return {
      key,
      worked,
      balance: worked,
      state: worked > 0 ? "weekend-work" : "empty",
    };
  }
  // Working day. Only days you actually tracked affect the balance — an
  // untracked working day (past, today or future) is ignored, never -8.
  if (worked <= 0) {
    return { key, worked, balance: 0, state: "empty" };
  }
  const reached = worked >= DAILY;
  return {
    key,
    worked,
    balance: worked - DAILY,
    // A short day today is still "in progress"; a short day in the past is under.
    state: reached ? "met" : key >= tKey ? "progress" : "under",
  };
}

/** Earliest day key that holds any data, or today if there is none. */
export function firstDataKey(entries: Entry[], marks: DayMark[]): string {
  let min: string | null = null;
  for (const e of entries) if (!min || e.date < min) min = e.date;
  for (const m of marks) if (!min || m.date < min) min = m.date;
  return min ?? todayKey();
}

/** Inclusive [start, end] day keys for a range. */
export function rangeBounds(
  range: RangeKey,
  entries: Entry[],
  marks: DayMark[],
  now: Date,
): { start: string; end: string } {
  const tKey = toDateKey(now);
  switch (range) {
    case "today":
      return { start: tKey, end: tKey };
    case "week": {
      const mon = startOfWeek(now);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start: toDateKey(mon), end: toDateKey(sun) };
    }
    case "month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: toDateKey(first), end: toDateKey(last) };
    }
    case "all":
      return { start: firstDataKey(entries, marks), end: tKey };
  }
}

/** DayInfo for every day in an inclusive key range. */
export function dayInfosForRange(
  startKey: string,
  endKey: string,
  worked: Map<string, number>,
  marks: Map<string, AbsenceType>,
  tKey: string,
): DayInfo[] {
  return daysInRange(startKey, endKey).map((key) =>
    dayInfo(key, worked.get(key) ?? 0, marks.get(key), tKey),
  );
}

/** Aggregate a range into worked / effective-target / balance totals. */
export function summarize(
  range: RangeKey,
  entries: Entry[],
  marks: DayMark[],
  running: RunningSession | null,
  now: Date,
): RangeSummary {
  const tKey = toDateKey(now);
  const worked = workedByDay(entries, running, now);
  const markMap = marksByDay(marks);
  const { start, end } = rangeBounds(range, entries, marks, now);
  // Never account beyond today: future days contribute nothing anyway.
  const cappedEnd = end < tKey ? end : tKey;
  const infos = dayInfosForRange(start, cappedEnd, worked, markMap, tKey);

  let workedSum = 0;
  let balanceSum = 0;
  let targetSum = 0;
  for (const info of infos) {
    workedSum += info.worked;
    balanceSum += info.balance;
    // Target = 8 h for today (your goal) and for any past working day you
    // actually tracked. Untracked days carry no target, so they never drag
    // the balance down.
    if (!info.mark && isWorkday(info.key)) {
      if (info.key === tKey || info.worked > 0) targetSum += DAILY;
    }
  }
  return {
    worked: workedSum,
    target: targetSum,
    balance: balanceSum,
  };
}

/** Convenience: build the day list for a given month (for the calendar). */
export function monthDayInfos(
  monthDate: Date,
  entries: Entry[],
  marks: DayMark[],
  running: RunningSession | null,
  now: Date,
): DayInfo[] {
  const tKey = toDateKey(now);
  const worked = workedByDay(entries, running, now);
  const markMap = marksByDay(marks);
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  return dayInfosForRange(toDateKey(first), toDateKey(last), worked, markMap, tKey);
}

/**
 * The account balance from all days strictly before `dayKey` (i.e. everything
 * that is already "banked", excluding today). Used to project a leave time.
 */
export function balanceBefore(
  dayKey: string,
  entries: Entry[],
  marks: DayMark[],
): number {
  const start = firstDataKey(entries, marks);
  if (start >= dayKey) return 0;
  const worked = workedByDay(entries, null, new Date(0));
  const markMap = marksByDay(marks);
  // End at the day before dayKey; pass dayKey as "today" so those days use the
  // past-day rule.
  const prevDay = daysInRange(start, dayKey);
  prevDay.pop(); // drop dayKey itself
  let sum = 0;
  for (const key of prevDay) {
    sum += dayInfo(key, worked.get(key) ?? 0, markMap.get(key), dayKey).balance;
  }
  return sum;
}

/** Entries for one day, sorted by start time. */
export function entriesForDay(entries: Entry[], key: string): Entry[] {
  return entries
    .filter((e) => e.date === key)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export { parseDateKey };
