# Development Context

This document captures the architecture, key decisions, and extension points to guide future development. Keep it concise and updated as the app evolves.

## Goals & Scope
- Single‑page Svelte app to plan yearly vacations for Saxony (DE).
- Fast, offline‑friendly UI; no backend.
- All 12 months visible without scrolling; clear states for holidays, bridge days, weekends, vacation.

## Architecture Overview
- Composition
  - `App.svelte`: shell, header (locale/year), layout, includes Legend, Calendar, VacationManager.
  - `components/Calendar.svelte`: 3×4 month grid.
  - `components/MonthView.svelte`: one month; weekday header + day grid.
  - `components/DayCell.svelte`: single day state + selection.
  - `components/VacationManager.svelte`: allocation, remaining, selected list.
  - `components/LocaleSwitcher.svelte`: DE/EN toggle.
- State (Svelte stores)
  - `stores/year.ts`: selected year.
  - `stores/vacation.ts`: total days, selected dates, derived remaining.
  - `stores/locale.ts`: UI locale with localStorage persistence.
- Utilities
  - `lib/date.ts`: ISO formatting, month iteration, helpers.
  - `lib/holidays.ts`: Saxony holidays + bridge‑day rules.
  - `lib/i18n.ts`: month/weekday names, date formatting.

## Key Decisions
- Region:
  - Holidays specific to Saxony (incl. Buß‑ und Bettag). Bridge days computed: Mon/Fri/Tue/Thu/Wed rules; weekends excluded; same‑year constraint.
- Layout:
  - 3×4 grid; compact typography; `auto-rows-fr` day grid for equal cell heights. Sidebar hidden below `lg` to keep no‑scroll guarantee.
- Styling:
  - Tailwind with Apple HIG‑inspired dark theme tokens in `tailwind.config.cjs`. System‑driven dark mode (`prefers-color-scheme`).
- Accessibility:
  - `focus-visible` rings, adequate contrast, semantic controls (buttons), titles for state hints.
- Localization:
  - Default `de-DE`; switcher to `en-US`. Dates via `Intl`.

## Extension Points
- Regions/Holidays:
  - Add new calculators in `lib/holidays.ts` (export a map by ISO date). Consider moving to strategy pattern per region code (`DE-SN`, `DE-BY`, etc.).
- Persistence:
  - Save `vacationDays` and `totalDays` in localStorage (similar to `locale`). Migrate with a versioned schema.
- Export/Share:
  - Generate CSV/ICS, or shareable URLs (e.g., compress ISO selections into hash params).
- Density & Zoom:
  - Provide compact/comfortable density toggle; breakpoints for 2×6 or 1×12 views.
- Tests/CI:
  - Add Vitest + Playwright smoke tests (render, toggle selection, locale switch). Wire into GitHub Actions.

## Coding Guidelines
- SRP: each component handles one concern; keep logic in `lib/*` or stores.
- Types: prefer explicit types for store values and function returns.
- Naming: kebab‑case files; PascalCase Svelte components; `*.types.ts` for shared types.
- Styling: use Tailwind utility classes; centralize tokens in config or `app.css`.

## Known Trade‑offs
- Bridge day rules are heuristic; may need regional/company overrides.
- No timezone handling beyond local; ISO keys use local date boundaries.

## Deployment
- GitHub Pages via Actions; Vite `base` must match repo name. SPA fallback at `public/404.html`.

