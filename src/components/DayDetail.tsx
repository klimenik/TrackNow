import { useMemo, useState } from "react";
import type { AbsenceType } from "../types";
import type { Store } from "../lib/useStore";
import { entriesForDay } from "../lib/balance";
import { fmtLongDate, minutesBetween, fmtDuration, timeToMinutes } from "../lib/time";

interface Props {
  store: Store;
  dayKey: string;
  onClose: () => void;
}

const ABSENCE: { type: AbsenceType; label: string }[] = [
  { type: "vacation", label: "Vacation" },
  { type: "holiday", label: "Holiday" },
  { type: "sick", label: "Sick" },
];

export function DayDetail({ store, dayKey, onClose }: Props) {
  const dayEntries = useMemo(
    () => entriesForDay(store.entries, dayKey),
    [store.entries, dayKey],
  );
  const mark = store.marks.find((m) => m.date === dayKey);
  const total = dayEntries.reduce(
    (sum, e) => sum + minutesBetween(e.start, e.end),
    0,
  );

  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [error, setError] = useState<string | null>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      setError("End must be after start.");
      return;
    }
    store.addEntry(dayKey, start, end);
    setError(null);
  };

  return (
    <div className="day-detail">
      <div className="dd-head">
        <h4>{fmtLongDate(dayKey)}</h4>
        <button className="icon-btn" onClick={onClose} aria-label="Schließen">
          ×
        </button>
      </div>

      <div className="dd-absence">
        {ABSENCE.map((a) => (
          <button
            key={a.type}
            className={mark?.type === a.type ? "chip active" : "chip"}
            onClick={() =>
              mark?.type === a.type
                ? store.removeMark(dayKey)
                : store.setMark(dayKey, a.type)
            }
          >
            {a.label}
          </button>
        ))}
      </div>

      {dayEntries.length > 0 ? (
        <ul className="dd-entries">
          {dayEntries.map((e) => (
            <li key={e.id}>
              <span>
                {e.start}–{e.end}
              </span>
              <span className="dd-dur">
                {fmtDuration(minutesBetween(e.start, e.end))} h
              </span>
              <button
                className="icon-btn danger"
                onClick={() => store.deleteEntry(e.id)}
                aria-label="Eintrag löschen"
              >
                ×
              </button>
            </li>
          ))}
          <li className="dd-total">
            <span>Total</span>
            <span className="dd-dur">{fmtDuration(total)} h</span>
            <span />
          </li>
        </ul>
      ) : (
        <p className="muted">No entries on this day.</p>
      )}

      <form className="dd-add" onSubmit={add}>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          aria-label="Von"
        />
        <span>–</span>
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          aria-label="Bis"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          + Entry
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
