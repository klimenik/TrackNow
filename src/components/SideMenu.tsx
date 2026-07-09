import { ThemeToggle } from "./ThemeToggle";

export type Page = "home" | "reports" | "data";

const NAV: { page: Page; label: string; icon: string }[] = [
  { page: "home", label: "Track", icon: "◷" },
  { page: "reports", label: "Reports", icon: "≣" },
  { page: "data", label: "Data & Backup", icon: "⤓" },
];

interface Props {
  open: boolean;
  page: Page;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}

export function SideMenu({ open, page, onClose, onNavigate }: Props) {
  return (
    <>
      <div
        className={`menu-overlay ${open ? "show" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <nav className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="brand-mark">◷</span>
          <span className="drawer-title">TrackNow</span>
        </div>

        <div className="drawer-nav">
          {NAV.map((n) => (
            <button
              key={n.page}
              className={n.page === page ? "nav-item active" : "nav-item"}
              onClick={() => onNavigate(n.page)}
            >
              <span className="nav-icon" aria-hidden>
                {n.icon}
              </span>
              {n.label}
            </button>
          ))}
        </div>

        <div className="drawer-foot">
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
