# Vacation Planner — Saxony (DE)

Plan vacations for the whole year with German public holidays, optional bridge days, school holidays, and your own vacation allocation. The UI supports German/English, follows a Material‑style light/dark theme, and shows all 12 months at once (with zoom + scroll if needed).

## Features
- Full‑year calendar: 3×4 grid, Monday–Sunday, compact layout.
- Saxony holidays (incl. Buß‑ und Bettag) + computed bridge days; select any German state (runtime fetch with fallback).
- Manage vacation allocation: set total, select workdays (vacation shown in green), see remaining.
- Automatic planning with preview variants: long breaks (≥7 days), even spread across the year, bridge‑day toggle, ignore months, optional school‑holiday preference; one occurrence of max vacation weeks where possible.
- School holidays highlighted in calendar and legend.
- Share plans: export/import JSON and copy a shareable link with the plan embedded in the URL hash (LZ‑string compressed).
 - Responsive layout: 1 month per row on mobile, 2 on small screens, 3 on desktop; zoom + scroll when needed.
- Dark mode (system‑driven), accessible focus states, high contrast.
- Localization: DE/EN with a toggle; German date formats by default.
- GitHub Pages deployment ready.

## Tech Stack
- Frontend: Svelte 4 + Vite 5
- Styling: Tailwind CSS 3
- State: Svelte stores
- Language/Tooling: TypeScript

## Project Structure
- `src/components/`: Calendar, MonthView, DayCell, VacationManager, AutoPlan, Legend, LocaleSwitcher, RegionSelector
- `src/stores/`: `year`, `vacation`, `locale`, `region`, `holidays`, `autoPlanner`
- `src/lib/`: `date.ts`, `holidays.ts`, `holidays_fetch.ts`, `auto_planner.ts`, `i18n.ts`, `school_holidays.ts`
- `public/404.html`: SPA redirect for GitHub Pages

## Development
- Prerequisites: Node 20+
- Install: `npm ci`
- Start dev server: `npm run dev`
- Build: `npm run build` (outputs to `dist/`)
- Preview build: `npm run preview`

## CI
- GitHub Actions runs unit tests and coverage on every push/PR (`.github/workflows/ci.yml`).
 - Lint job runs ESLint (`npm run lint`).

## Usage
- Year selector (top right) changes the calendar year.
- Locale switcher (DE/EN) and German region selector (Bundesland) next to the year selector.
- Set your total vacation days; click workdays to toggle vacation (green). The calendar fully refreshes per year to reflect new holidays and school breaks.
- Colors: green = vacation, red = holiday, amber = bridge day, gray = weekend, emerald tint = school holidays.
- Automatic Planning: set parameters (bridge days on/off, max vacation/work weeks, even spread, ignore months, respect school holidays), generate multiple preview variants, and apply the plan.
- Share: in the sidebar “Share plan” — export JSON, import from file/JSON, or copy a link. Opening a link with `#plan=...` will load the shared plan.
- Density & Zoom: use the Compact/Comfort toggle and Zoom slider to fit the full year; the calendar pane scrolls if necessary.
- Tabs: the sidebar groups Vacation, Auto Plan, and Share in tabs.
- Persistence: UI/planner settings and state are saved to localStorage (density, zoom, planner parameters, selected year, region, vacation days, total days, locale).

## Deployment (GitHub Pages)
- The app is configured with `base: '/vacation-plan/'` in `vite.config.ts`. If your repo name differs, update this value.
- Enable Pages: Settings → Pages → Source: GitHub Actions.
- The workflow `.github/workflows/pages.yml` builds on pushes to `main` and deploys `dist/`.

## Customization
- Region/holidays: at runtime, holidays are fetched from feiertage-api.de for the selected state. If network fails, the app falls back to built‑in rules (Saxony or national common holidays). To change logic, see `src/lib/holidays_fetch.ts` and `src/lib/holidays.ts`.
- Density/layout: adjust sizing in `MonthView.svelte` and `DayCell.svelte`.
- Color theme: tune Tailwind tokens in `tailwind.config.cjs` and styles in `src/app.css` (Material‑inspired, system dark mode).
 - Planner constants: tweak scoring and UI limits in `src/lib/constants.ts` (e.g., min break days, min gap, zoom bounds, bridge/weekend weights).

## Testing & Coverage
- Run unit tests: `npm run test` (watch) or `npm run test:run`
- Coverage: `npm run test:coverage` (HTML in `coverage/`); thresholds: ≥60% for statements/functions/lines (branches 50%).
 - Planner variants use a deterministic jitter when a seed is provided (the UI passes `Date.now()` for diversity; tests can pass a fixed seed).

## Accessibility
- Keyboard focus rings and adequate contrast for dark/light themes.
- Week starts Monday; screen‑reader labels supplied via titles for day states.

## License
- MIT — see `LICENSE`.
