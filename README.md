# Vacation Planner — Saxony (DE)

Plan vacations for the whole year with public holidays, bridge days, and your own vacation allocation. The UI shows all 12 months at once (no scrolling), supports German/English, and adapts to light/dark mode following Apple HIG principles.

## Features
- Full‑year calendar: 3×4 grid, Monday–Sunday, compact layout.
- Saxony holidays (incl. Buß‑ und Bettag) + computed bridge days.
- Manage vacation allocation: set total, select workdays, see remaining.
- Dark mode (system‑driven), accessible focus states, high contrast.
- Localization: DE/EN with a toggle; German date formats by default.
- GitHub Pages deployment ready.

## Tech Stack
- Frontend: Svelte 4 + Vite 5
- Styling: Tailwind CSS 3
- State: Svelte stores
- Language/Tooling: TypeScript

## Project Structure
- `src/components/`: Calendar, MonthView, DayCell, VacationManager, Legend, LocaleSwitcher
- `src/stores/`: `year`, `vacation`, `locale`
- `src/lib/`: `date.ts`, `holidays.ts`, `i18n.ts`
- `public/404.html`: SPA redirect for GitHub Pages

## Development
- Prerequisites: Node 20+
- Install: `npm ci`
- Start dev server: `npm run dev`
- Build: `npm run build` (outputs to `dist/`)
- Preview build: `npm run preview`

## Usage
- Year selector (top right) changes the calendar year.
- Locale switcher (DE/EN) next to the year selector.
- Set your total vacation days in the sidebar; click workdays to toggle vacation.
- Colors: blue = vacation, red = holiday, amber = bridge day, gray = weekend.

## Deployment (GitHub Pages)
- The app is configured with `base: '/vacation-plan/'` in `vite.config.ts`. If your repo name differs, update this value.
- Enable Pages: Settings → Pages → Source: GitHub Actions.
- The workflow `.github/workflows/pages.yml` builds on pushes to `main` and deploys `dist/`.

## Customization
- Region/holidays: edit `src/lib/holidays.ts` to change rules or switch region.
- Density/layout: adjust sizing in `MonthView.svelte` and `DayCell.svelte`.
- Color theme: tune Tailwind tokens in `tailwind.config.cjs` and styles in `src/app.css`.

## Accessibility
- Keyboard focus rings and adequate contrast for dark/light themes.
- Week starts Monday; screen‑reader labels supplied via titles for day states.

## License
- MIT — see `LICENSE`.

