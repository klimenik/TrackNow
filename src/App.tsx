import { useState } from "react";
import type { RangeKey } from "./types";
import { useNow, useStore } from "./lib/useStore";
import { AccountHero } from "./components/AccountHero";
import { Tracker } from "./components/Tracker";
import { LeaveBy } from "./components/LeaveBy";
import { EntryList } from "./components/EntryList";
import { DataPanel } from "./components/DataPanel";
import { SideMenu, type Page } from "./components/SideMenu";

const PAGE_TITLE: Record<Page, string> = {
  home: "Track",
  reports: "Reports",
  data: "Data & Backup",
};

export default function App() {
  const store = useStore();
  // Tick every second while the timer runs (for the live clock), else every
  // minute so "today" stays fresh without wasting cycles.
  const now = useNow(store.running ? 1000 : 60000, true);

  const [range, setRange] = useState<RangeKey>("today");
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <SideMenu
        open={menuOpen}
        page={page}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
      />

      <header className="app-header">
        <button
          className="burger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
        <h1 className="page-title">{PAGE_TITLE[page]}</h1>
        <div className="header-spacer" />
      </header>

      <main>
        {page === "home" && (
          <>
            <AccountHero
              store={store}
              now={now}
              range={range}
              onRangeChange={setRange}
            />
            <Tracker store={store} now={now} />
            <LeaveBy store={store} now={now} />
          </>
        )}

        {page === "reports" && <EntryList store={store} />}

        {page === "data" && <DataPanel store={store} />}
      </main>
    </div>
  );
}
