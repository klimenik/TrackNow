import { useState } from "react";
import type { Store } from "../lib/useStore";
import { fmtElapsed, timeToMinutes, todayKey, toTimeStr } from "../lib/time";

interface Props {
  store: Store;
  now: Date;
}

export function Tracker({ store, now }: Props) {
  const { running } = store;
  const [editStart, setEditStart] = useState(false);
  const elapsedMs = running
    ? now.getTime() - new Date(running.startedAt).getTime()
    : 0;

  return (
    <section className="card tracker">
      <div className="tracker-live">
        <div className={`clock ${running ? "on" : ""}`}>
          {running ? fmtElapsed(elapsedMs) : "0:00:00"}
        </div>
        {running ? (
          <div className="tracker-actions">
            <button className="btn btn-stop" onClick={store.stopTimer}>
              ■ Stop
            </button>
            <button
              className="btn btn-ghost"
              onClick={store.cancelTimer}
              title="Discard running time"
            >
              Discard
            </button>
          </div>
        ) : (
          <button className="btn btn-start" onClick={store.startTimer}>
            ▶ Start
          </button>
        )}
        {running &&
          (editStart ? (
            <div className="tracker-since edit">
              <span>Started at</span>
              <input
                type="time"
                autoFocus
                defaultValue={toTimeStr(new Date(running.startedAt))}
                max={toTimeStr(now)}
                onChange={(e) => {
                  if (e.target.value) store.adjustRunningStart(e.target.value);
                }}
                onBlur={() => setEditStart(false)}
              />
              <button
                className="link-btn"
                onClick={() => setEditStart(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              className="tracker-since link-btn"
              onClick={() => setEditStart(true)}
              title="Adjust start time"
            >
              Running since {toTimeStr(new Date(running.startedAt))} ✎
            </button>
          ))}
      </div>

      <ManualEntry store={store} nowKey={todayKey()} defaultTime={toTimeStr(now)} />
    </section>
  );
}

function ManualEntry({
  store,
  nowKey,
  defaultTime,
}: {
  store: Store;
  nowKey: string;
  defaultTime: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(nowKey);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState(defaultTime);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !start || !end) {
      setError("Please fill in date, start and end.");
      return;
    }
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      setError("End must be after start.");
      return;
    }
    store.addEntry(date, start, end);
    setError(null);
    setStart(end);
  };

  if (!open) {
    return (
      <button className="link-btn" onClick={() => setOpen(true)}>
        + Add time manually
      </button>
    );
  }

  return (
    <form className="manual" onSubmit={submit}>
      <div className="manual-row">
        <label>
          Date
          <input
            type="date"
            value={date}
            max={nowKey}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          From
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="manual-actions">
        <button type="submit" className="btn btn-primary">
          Add
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Close
        </button>
      </div>
    </form>
  );
}
