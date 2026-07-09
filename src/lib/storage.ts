// All persistence lives here. Data never leaves the browser except through
// an explicit JSON export the user triggers.

import { ENTRIES_KEY, LAST_BACKUP_KEY, MARKS_KEY, RUNNING_KEY } from "../config";
import type { Backup, DayMark, Entry, RunningSession } from "../types";

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function loadEntries(): Entry[] {
  return readArray<Entry>(ENTRIES_KEY);
}

export function saveEntries(entries: Entry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function loadMarks(): DayMark[] {
  return readArray<DayMark>(MARKS_KEY);
}

export function saveMarks(marks: DayMark[]): void {
  localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
}

export function loadRunning(): RunningSession | null {
  try {
    const raw = localStorage.getItem(RUNNING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.startedAt === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRunning(running: RunningSession | null): void {
  if (running) localStorage.setItem(RUNNING_KEY, JSON.stringify(running));
  else localStorage.removeItem(RUNNING_KEY);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------- backup ----------

export function getLastBackup(): string | null {
  return localStorage.getItem(LAST_BACKUP_KEY);
}

export function setLastBackup(iso: string): void {
  localStorage.setItem(LAST_BACKUP_KEY, iso);
}

export function exportBackup(entries: Entry[], marks: DayMark[]): void {
  const now = new Date().toISOString();
  const backup: Backup = {
    app: "tracknow",
    version: 1,
    exportedAt: now,
    entries,
    marks,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tracknow-backup-${now.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setLastBackup(now);
}

export interface ImportResult {
  entries: Entry[];
  marks: DayMark[];
}

/**
 * Merge a backup file into current data. Entries merge by id, day marks merge
 * by date; imported records win on conflict. Returns the merged data.
 */
export function importBackup(text: string): ImportResult {
  const data = JSON.parse(text) as Partial<Backup>;
  if (!data || !Array.isArray(data.entries) || !Array.isArray(data.marks)) {
    throw new Error("Datei ist kein gültiges TrackNow-Backup.");
  }

  const entriesById = new Map<string, Entry>();
  for (const e of loadEntries()) entriesById.set(e.id, e);
  for (const e of data.entries) {
    if (e && e.id) entriesById.set(e.id, e);
  }

  const marksByDate = new Map<string, DayMark>();
  for (const m of loadMarks()) marksByDate.set(m.date, m);
  for (const m of data.marks) {
    if (m && m.date) marksByDate.set(m.date, m);
  }

  const entries = [...entriesById.values()].sort((a, b) =>
    a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date),
  );
  const marks = [...marksByDate.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  saveEntries(entries);
  saveMarks(marks);
  return { entries, marks };
}
