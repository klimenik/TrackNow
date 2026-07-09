import { useMemo } from "react";
import type { RangeKey } from "../types";
import type { Store } from "../lib/useStore";
import { summarize } from "../lib/balance";
import { fmtDuration, fmtSigned } from "../lib/time";
import { Segmented } from "./Segmented";

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

interface Props {
  store: Store;
  now: Date;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
}

export function AccountHero({ store, now, range, onRangeChange }: Props) {
  const summary = useMemo(
    () => summarize(range, store.entries, store.marks, store.running, now),
    [range, store.entries, store.marks, store.running, now],
  );

  const sign = summary.balance > 0 ? "pos" : summary.balance < 0 ? "neg" : "zero";

  return (
    <section className="hero card">
      <div className="hero-top">
        <span className="hero-label">Overtime balance</span>
        <Segmented
          options={RANGES}
          value={range}
          onChange={onRangeChange}
          ariaLabel="Range"
        />
      </div>

      <div className={`hero-balance ${sign}`}>
        {fmtSigned(summary.balance, false)}
        <span className="hero-unit">h</span>
      </div>

      <p className="hero-meta">
        Worked {fmtDuration(summary.worked)} · Target{" "}
        {fmtDuration(summary.target)}
      </p>
    </section>
  );
}
