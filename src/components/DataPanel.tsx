import { useRef, useState } from "react";
import type { Store } from "../lib/useStore";
import { exportBackup, getLastBackup } from "../lib/storage";

interface Props {
  store: Store;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function fmtAgo(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function DataPanel({ store }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(() =>
    getLastBackup(),
  );

  const hasData = store.entries.length > 0 || store.marks.length > 0;
  const stale =
    hasData &&
    (!lastBackup || Date.now() - new Date(lastBackup).getTime() > WEEK_MS);

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      store.importFromText(text);
      setError(null);
      setStatus(`Imported "${file.name}".`);
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  };

  return (
    <section className="card data-panel">
      <h3>Data &amp; Backup</h3>
      <p className="muted">
        All times stay only in this browser. For a backup, export them as a JSON
        file and keep it somewhere safe (e.g. Files / iCloud).
      </p>

      <div className="data-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            exportBackup(store.entries, store.marks);
            setLastBackup(getLastBackup());
            setStatus("Backup exported.");
            setError(null);
          }}
        >
          ↧ Export backup
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => fileInput.current?.click()}
        >
          ↥ Import backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <p className="backup-age">
        Last backup:{" "}
        <strong>{lastBackup ? fmtAgo(lastBackup, Date.now()) : "never"}</strong>
      </p>
      {stale && (
        <p className="warn">
          ⚠ It's been a while — export a backup so you don't lose your data.
        </p>
      )}

      {status && <p className="success">{status}</p>}
      {error && <p className="error">{error}</p>}

      <div className="data-secondary">
        <button
          className="link-btn"
          onClick={() => {
            if (
              store.entries.length === 0 ||
              confirm("Replace current data with demo data?")
            ) {
              store.loadSample();
              setStatus("Demo data loaded.");
              setError(null);
            }
          }}
        >
          Load demo data
        </button>
        <button
          className="link-btn danger"
          onClick={() => {
            if (
              confirm(
                "Really delete ALL tracked times and absences? This cannot be undone.",
              )
            ) {
              store.clearAll();
              setStatus("All data deleted.");
              setError(null);
            }
          }}
        >
          Delete all data
        </button>
      </div>
    </section>
  );
}
