// Illustrative demo data so the app can be explored without real tracking.
// Generated relative to "now" so the day-states show up: full days, an
// overtime day, a short (undertime) day, some untracked days that simply stay
// neutral, a bit of weekend work, and a partially tracked "today".

import type { DayMark, Entry } from "../types";
import { newId } from "./storage";
import { startOfWeek, toDateKey } from "./time";

type Block = [string, string];

const FULL: Block[] = [
  ["09:00", "12:30"],
  ["13:00", "17:30"],
]; // 8:00
const OVERTIME: Block[] = [
  ["08:30", "12:30"],
  ["13:00", "17:30"],
]; // 8:30
const SHORT: Block[] = [
  ["09:00", "12:30"],
  ["13:00", "15:30"],
]; // 6:00 -> undertime
const TODAY_PARTIAL: Block[] = [["09:00", "12:30"]]; // 3:30

function shift(base: Date, days: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function sampleData(now: Date): { entries: Entry[]; marks: DayMark[] } {
  const entries: Entry[] = [];
  const tKey = toDateKey(now);

  const push = (key: string, blocks: Block[]) => {
    if (key > tKey) return; // never seed the future
    for (const [start, end] of blocks) {
      entries.push({
        id: newId(),
        date: key,
        start,
        end,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const thisMon = startOfWeek(now);
  const lastMon = shift(thisMon, -7);
  const twoMon = shift(thisMon, -14);

  // Two weeks ago — a couple of full days, the rest simply untracked (neutral).
  push(toDateKey(shift(twoMon, 1)), FULL);
  push(toDateKey(shift(twoMon, 2)), FULL);
  push(toDateKey(shift(twoMon, 3)), FULL);

  // Last week — full days, one overtime day, one short (undertime) day,
  // Thursday left untracked (stays neutral), plus a little Saturday work.
  push(toDateKey(lastMon), FULL); // Mon
  push(toDateKey(shift(lastMon, 1)), OVERTIME); // Tue +0:30
  push(toDateKey(shift(lastMon, 2)), FULL); // Wed
  push(toDateKey(shift(lastMon, 3)), SHORT); // Thu -2:00
  // Fri left untracked
  push(toDateKey(shift(lastMon, 5)), [["10:00", "12:00"]]); // Sat +2:00

  // This week up to today.
  for (let off = 0; off <= 4; off++) {
    const key = toDateKey(shift(thisMon, off));
    if (key < tKey) push(key, FULL);
    else if (key === tKey) push(key, TODAY_PARTIAL);
  }

  return { entries, marks: [] };
}
