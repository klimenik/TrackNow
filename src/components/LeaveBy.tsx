import { useMemo } from "react";
import type { Store } from "../lib/useStore";
import { balanceBefore, workedByDay } from "../lib/balance";
import { DAILY_TARGET_MINUTES as DAILY } from "../config";
import {
  clockAfter,
  fmtDuration,
  isSameDayAfter,
  isWorkday,
  toDateKey,
} from "../lib/time";

interface Props {
  store: Store;
  now: Date;
}

/**
 * A compact "today" card: a progress bar toward the 8 h day target plus a
 * projection of when you can stop — both for the day target and for bringing
 * the overtime account back to even.
 */
export function LeaveBy({ store, now }: Props) {
  const tKey = toDateKey(now);

  const { worked, prior } = useMemo(() => {
    const w = workedByDay(store.entries, store.running, now).get(tKey) ?? 0;
    const p = balanceBefore(tKey, store.entries, store.marks);
    return { worked: w, prior: p };
  }, [store.entries, store.marks, store.running, now, tKey]);

  if (!isWorkday(tKey)) return null;
  if (!store.running && worked === 0) return null;

  const remainingTarget = DAILY - worked;
  const reached = remainingTarget <= 0;
  const overtimeToday = worked - DAILY;
  const pct = Math.min(100, Math.round((worked / DAILY) * 100));

  const remainingEven = DAILY - prior - worked;

  const projected = (mins: number) => {
    const time = clockAfter(now, mins);
    return isSameDayAfter(now, mins) ? time : `${time} (next day)`;
  };

  return (
    <section className="card leaveby">
      <div className="lb-head">
        <span className="lb-title">Today</span>
        <span className="lb-count">
          {fmtDuration(worked)}<span className="lb-of"> / 8:00</span>
        </span>
      </div>

      <div className="lb-bar">
        <div
          className={`lb-fill ${reached ? "full" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="lb-status">
        {reached ? (
          <span className="lb-good">
            8 h reached
            {overtimeToday > 0 && ` · +${fmtDuration(overtimeToday)} over`}
          </span>
        ) : store.running ? (
          <span>
            Done at <strong>{projected(remainingTarget)}</strong>
            <span className="lb-sub"> · {fmtDuration(remainingTarget)} to go</span>
          </span>
        ) : (
          <span>
            <strong>{fmtDuration(remainingTarget)}</strong> left to 8 h
          </span>
        )}
      </div>

      {prior !== 0 && !reached && store.running && (
        <div className="lb-even">
          {remainingEven <= 0 ? (
            "Account even — you can stop now"
          ) : (
            <>
              Account even at <strong>{projected(remainingEven)}</strong>
            </>
          )}
        </div>
      )}
    </section>
  );
}
