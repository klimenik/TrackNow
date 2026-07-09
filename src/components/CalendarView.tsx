import { useMemo, useState } from "react";
import type { Store } from "../lib/useStore";
import type { DayState } from "../lib/balance";
import { monthDayInfos } from "../lib/balance";
import { fmtMonthYear, parseDateKey, toDateKey } from "../lib/time";
import { DayDetail } from "./DayDetail";

interface Props {
  store: Store;
  now: Date;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function stateClass(state: DayState): string {
  switch (state) {
    case "met":
    case "absence":
      return "d-good";
    case "weekend-work":
      return "d-extra";
    case "under":
      return "d-bad";
    case "progress":
      return "d-progress";
    default:
      return "d-empty";
  }
}

export function CalendarView({ store, now }: Props) {
  const [cursor, setCursor] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [selected, setSelected] = useState<string | null>(null);

  const infos = useMemo(
    () => monthDayInfos(cursor, store.entries, store.marks, store.running, now),
    [cursor, store.entries, store.marks, store.running, now],
  );

  const tKey = toDateKey(now);

  // Leading blanks so the 1st sits under the right weekday (Mon-based).
  const firstDow = (parseDateKey(infos[0].key).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstDow });

  const shiftMonth = (delta: number) => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
    setSelected(null);
  };

  return (
    <section className="card calendar">
      <div className="cal-head">
        <button
          className="icon-btn"
          onClick={() => shiftMonth(-1)}
          aria-label="Vorheriger Monat"
        >
          ‹
        </button>
        <h3>{fmtMonthYear(cursor)}</h3>
        <button
          className="icon-btn"
          onClick={() => shiftMonth(1)}
          aria-label="Nächster Monat"
        >
          ›
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-dow">
            {w}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`b${i}`} className="cal-cell blank" />
        ))}
        {infos.map((info) => {
          const day = parseDateKey(info.key).getDate();
          const hours = info.worked > 0 ? (info.worked / 60).toFixed(1) : "";
          const isToday = info.key === tKey;
          return (
            <button
              key={info.key}
              className={[
                "cal-cell",
                stateClass(info.state),
                isToday ? "today" : "",
                selected === info.key ? "selected" : "",
              ].join(" ")}
              onClick={() =>
                setSelected(selected === info.key ? null : info.key)
              }
            >
              <span className="cal-day">{day}</span>
              {info.mark ? (
                <span className="cal-mark">
                  {info.mark === "vacation"
                    ? "Vacation"
                    : info.mark === "holiday"
                      ? "Holiday"
                      : "Sick"}
                </span>
              ) : (
                hours && <span className="cal-hours">{hours} h</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span>
          <i className="dot d-good" /> Target met / off
        </span>
        <span>
          <i className="dot d-bad" /> Under target
        </span>
        <span>
          <i className="dot d-progress" /> Today, open
        </span>
        <span>
          <i className="dot d-extra" /> Weekend
        </span>
      </div>

      {selected && (
        <DayDetail store={store} dayKey={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
