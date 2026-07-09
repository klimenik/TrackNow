// Illustrative demo data so the app can be explored without real tracking.
// Everything is generated relative to "now" so all day-states show up:
// full days, overtime, a forgotten (red) day, vacation / holiday / sick,
// a bit of weekend work, and a partially tracked "today".

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
]; // 6:00
const TODAY_PARTIAL: Block[] = [["09:00", "12:30"]]; // 3:30

function shift(base: Date, days: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function sampleData(now: Date): { entries: Entry[]; marks: DayMark[] } {
  const entries: Entry[] = [];
  const marks: DayMark[] = [];
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

  // Two weeks ago
  marks.push({ date: toDateKey(twoMon), type: "holiday" }); // Mon holiday
  push(toDateKey(shift(twoMon, 1)), FULL);
  push(toDateKey(shift(twoMon, 2)), FULL);
  push(toDateKey(shift(twoMon, 3)), SHORT);
  marks.push({ date: toDateKey(shift(twoMon, 4)), type: "sick" }); // Fri sick

  // Last week
  push(toDateKey(lastMon), FULL); // Mon
  push(toDateKey(shift(lastMon, 1)), OVERTIME); // Tue overtime
  push(toDateKey(shift(lastMon, 2)), FULL); // Wed
  // Thu deliberately left empty -> counts as -8:00 (red)
  marks.push({ date: toDateKey(shift(lastMon, 4)), type: "vacation" }); // Fri vacation
  push(toDateKey(shift(lastMon, 5)), [["10:00", "12:00"]]); // Sat 2h

  // This week up to today
  for (let off = 0; off <= 4; off++) {
    const key = toDateKey(shift(thisMon, off));
    if (key < tKey) push(key, FULL);
    else if (key === tKey) push(key, TODAY_PARTIAL);
  }

  return { entries, marks };
}
