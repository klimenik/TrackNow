# TrackNow

A deliberately minimal work-time tracker that runs entirely in the browser.
No account, no server — all data stays in your browser's local storage, with a
manual JSON export/import as backup. Installable as a PWA and works offline.

**Live:** https://klimenik.github.io/TrackNow/

## Features

- Start/stop timer **and** manual time entry (from–to)
- Overtime account with Today / Week / Month / All views
- 8 h target on weekdays (Mon–Fri); a past workday with no entry counts as −8 h,
  today only counts once you start tracking
- Vacation / holiday / sick days mark a whole day as fulfilled
- "Today" progress bar and a projected leave time (when you hit 8 h / break even)
- Day-by-day reports with inline editing
- JSON backup export/import with a backup-freshness reminder

## Tech

React + TypeScript + Vite, PWA via `vite-plugin-pwa`. No backend.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml` (Pages is enabled automatically on the first run).
