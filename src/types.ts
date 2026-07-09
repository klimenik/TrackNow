// A single tracked stretch of work. Always within one calendar day.
export interface Entry {
  id: string;
  /** Local calendar day, "YYYY-MM-DD". */
  date: string;
  /** Start time of day, "HH:MM". */
  start: string;
  /** End time of day, "HH:MM". end > start on the same day. */
  end: string;
  createdAt: string; // ISO timestamp
}

export type AbsenceType = "vacation" | "holiday" | "sick";

/** A whole day marked as absent; counts as a fulfilled 8 h day. */
export interface DayMark {
  /** Local calendar day, "YYYY-MM-DD". */
  date: string;
  type: AbsenceType;
}

/** The currently running stopwatch, if any. Persisted so it survives reloads. */
export interface RunningSession {
  startedAt: string; // ISO timestamp
}

export type RangeKey = "today" | "week" | "month" | "all";

/** Shape of the exported / imported backup file. */
export interface Backup {
  app: "tracknow";
  version: 1;
  exportedAt: string;
  entries: Entry[];
  marks: DayMark[];
}
