import { useState } from "react";
import { getTheme, nextTheme, setTheme, type Theme } from "../lib/theme";

const LABEL: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const ICON: Record<Theme, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const cycle = () => {
    const next = nextTheme(theme);
    setTheme(next);
    setThemeState(next);
  };
  return (
    <button
      className="theme-toggle"
      onClick={cycle}
      title={`Theme: ${LABEL[theme]} (click to switch)`}
      aria-label={`Theme: ${LABEL[theme]}`}
    >
      <span aria-hidden>{ICON[theme]}</span>
      <span className="theme-label">{LABEL[theme]}</span>
    </button>
  );
}
