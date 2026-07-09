// A tiny store on top of localStorage. Components read the returned data and
// call the actions; every action persists and triggers a re-render.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AbsenceType, DayMark, Entry, RunningSession } from "../types";
import {
  importBackup,
  loadEntries,
  loadMarks,
  loadRunning,
  newId,
  saveEntries,
  saveMarks,
  saveRunning,
} from "./storage";
import { toDateKey, toTimeStr, timeToMinutes } from "./time";
import { sampleData } from "./seed";

export interface Store {
  entries: Entry[];
  marks: DayMark[];
  running: RunningSession | null;

  startTimer: () => void;
  stopTimer: () => void;
  cancelTimer: () => void;
  adjustRunningStart: (start: string) => void;

  addEntry: (date: string, start: string, end: string) => void;
  updateEntry: (id: string, patch: Partial<Omit<Entry, "id">>) => void;
  deleteEntry: (id: string) => void;

  setMark: (date: string, type: AbsenceType) => void;
  removeMark: (date: string) => void;

  importFromText: (text: string) => void;
  loadSample: () => void;
  clearAll: () => void;
}

function sortEntries(list: Entry[]): Entry[] {
  return [...list].sort((a, b) =>
    a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date),
  );
}

export function useStore(): Store {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [marks, setMarks] = useState<DayMark[]>(() => loadMarks());
  const [running, setRunning] = useState<RunningSession | null>(() => loadRunning());

  const commitEntries = useCallback((next: Entry[]) => {
    const sorted = sortEntries(next);
    saveEntries(sorted);
    setEntries(sorted);
  }, []);

  const commitMarks = useCallback((next: DayMark[]) => {
    const sorted = [...next].sort((a, b) => a.date.localeCompare(b.date));
    saveMarks(sorted);
    setMarks(sorted);
  }, []);

  const commitRunning = useCallback((next: RunningSession | null) => {
    saveRunning(next);
    setRunning(next);
  }, []);

  const startTimer = useCallback(() => {
    if (running) return;
    commitRunning({ startedAt: new Date().toISOString() });
  }, [running, commitRunning]);

  const addEntry = useCallback(
    (date: string, start: string, end: string) => {
      const entry: Entry = {
        id: newId(),
        date,
        start,
        end,
        createdAt: new Date().toISOString(),
      };
      commitEntries([...entries, entry]);
    },
    [entries, commitEntries],
  );

  const stopTimer = useCallback(() => {
    if (!running) return;
    const started = new Date(running.startedAt);
    const now = new Date();
    const date = toDateKey(started);
    const start = toTimeStr(started);
    // No entries cross midnight: if the timer ran into the next day, clamp the
    // end to 23:59 of the start day.
    const sameDay = toDateKey(now) === date;
    const end = sameDay ? toTimeStr(now) : "23:59";
    commitRunning(null);
    if (timeToMinutes(end) > timeToMinutes(start)) {
      addEntry(date, start, end);
    }
  }, [running, commitRunning, addEntry]);

  const cancelTimer = useCallback(() => {
    commitRunning(null);
  }, [commitRunning]);

  const adjustRunningStart = useCallback(
    (start: string) => {
      if (!running) return;
      const started = new Date(running.startedAt);
      const [h, m] = start.split(":").map(Number);
      const next = new Date(
        started.getFullYear(),
        started.getMonth(),
        started.getDate(),
        h,
        m,
        0,
        0,
      );
      // A start time can only move earlier/within today, never into the future.
      if (next.getTime() > Date.now()) return;
      commitRunning({ startedAt: next.toISOString() });
    },
    [running, commitRunning],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<Entry, "id">>) => {
      commitEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    [entries, commitEntries],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      commitEntries(entries.filter((e) => e.id !== id));
    },
    [entries, commitEntries],
  );

  const setMark = useCallback(
    (date: string, type: AbsenceType) => {
      const others = marks.filter((m) => m.date !== date);
      commitMarks([...others, { date, type }]);
    },
    [marks, commitMarks],
  );

  const removeMark = useCallback(
    (date: string) => {
      commitMarks(marks.filter((m) => m.date !== date));
    },
    [marks, commitMarks],
  );

  const importFromText = useCallback(
    (text: string) => {
      const result = importBackup(text);
      setEntries(sortEntries(result.entries));
      setMarks(result.marks);
    },
    [],
  );

  const loadSample = useCallback(() => {
    const { entries: e, marks: m } = sampleData(new Date());
    commitEntries(e);
    commitMarks(m);
    commitRunning(null);
  }, [commitEntries, commitMarks, commitRunning]);

  const clearAll = useCallback(() => {
    commitEntries([]);
    commitMarks([]);
    commitRunning(null);
  }, [commitEntries, commitMarks, commitRunning]);

  return useMemo(
    () => ({
      entries,
      marks,
      running,
      startTimer,
      stopTimer,
      cancelTimer,
      adjustRunningStart,
      addEntry,
      updateEntry,
      deleteEntry,
      setMark,
      removeMark,
      importFromText,
      loadSample,
      clearAll,
    }),
    [
      entries,
      marks,
      running,
      startTimer,
      stopTimer,
      cancelTimer,
      adjustRunningStart,
      addEntry,
      updateEntry,
      deleteEntry,
      setMark,
      removeMark,
      importFromText,
      loadSample,
      clearAll,
    ],
  );
}

/** A ticking clock for live displays. Re-renders every `ms` while active. */
export function useNow(ms: number, active: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms, active]);
  return now;
}
