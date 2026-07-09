import { useMemo, useState } from "react";
import type { AbsenceType, Entry } from "../types";
import type { Store } from "../lib/useStore";
import {
  fmtDuration,
  fmtLongDate,
  fmtSigned,
  minutesBetween,
  timeToMinutes,
  todayKey,
} from "../lib/time";
import { dayInfo } from "../lib/balance";

interface Props {
  store: Store;
}

const ABSENCE_LABEL: Record<AbsenceType, string> = {
  vacation: "Vacation",
  holiday: "Holiday",
  sick: "Sick",
};

export function EntryList({ store }: Props) {
  const tKey = todayKey();

  // Collect every day that has entries or a mark, newest first.
  const days = useMemo(() => {
    const keys = new Set<string>();
    for (const e of store.entries) keys.add(e.date);
    for (const m of store.marks) keys.add(m.date);
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [store.entries, store.marks]);

  if (days.length === 0) {
    return (
      <section className="card">
        <p className="muted empty-state">
          Nothing tracked yet. Start the timer on the Track screen or add a time
          manually.
        </p>
      </section>
    );
  }

  return (
    <section className="entry-list">
      {days.map((key) => {
        const dayEntries = store.entries
          .filter((e) => e.date === key)
          .sort((a, b) => a.start.localeCompare(b.start));
        const mark = store.marks.find((m) => m.date === key)?.type;
        const worked = dayEntries.reduce(
          (s, e) => s + minutesBetween(e.start, e.end),
          0,
        );
        const info = dayInfo(key, worked, mark, tKey);
        const sign =
          info.balance > 0 ? "pos" : info.balance < 0 ? "neg" : "zero";

        return (
          <div key={key} className="day-group card">
            <div className="dg-head">
              <div>
                <div className="dg-date">{fmtLongDate(key)}</div>
                <div className="dg-sub">
                  {mark ? ABSENCE_LABEL[mark] : `${fmtDuration(worked)} h`}
                </div>
              </div>
              <span className={`balance-chip ${sign}`}>
                {fmtSigned(info.balance, false)}
              </span>
            </div>

            {dayEntries.length > 0 && (
              <ul className="dg-entries">
                {dayEntries.map((e) => (
                  <EntryRow key={e.id} entry={e} store={store} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

function EntryRow({ entry, store }: { entry: Entry; store: Store }) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(entry.start);
  const [end, setEnd] = useState(entry.end);
  const [error, setError] = useState(false);

  if (!editing) {
    return (
      <li>
        <span className="dg-time">
          {entry.start}–{entry.end}
        </span>
        <span className="dg-dur">
          {fmtDuration(minutesBetween(entry.start, entry.end))} h
        </span>
        <button
          className="icon-btn"
          onClick={() => {
            setStart(entry.start);
            setEnd(entry.end);
            setError(false);
            setEditing(true);
          }}
          aria-label="Edit entry"
        >
          ✎
        </button>
        <button
          className="icon-btn danger"
          onClick={() => store.deleteEntry(entry.id)}
          aria-label="Delete entry"
        >
          ×
        </button>
      </li>
    );
  }

  const save = () => {
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      setError(true);
      return;
    }
    store.updateEntry(entry.id, { start, end });
    setEditing(false);
  };

  return (
    <li className="dg-edit">
      <input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className={error ? "invalid" : ""}
        aria-label="From"
      />
      <span>–</span>
      <input
        type="time"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className={error ? "invalid" : ""}
        aria-label="To"
      />
      <button className="icon-btn ok" onClick={save} aria-label="Save">
        ✓
      </button>
      <button
        className="icon-btn"
        onClick={() => setEditing(false)}
        aria-label="Cancel"
      >
        ×
      </button>
    </li>
  );
}
