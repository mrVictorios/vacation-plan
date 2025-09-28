# Development Context

This document captures the architecture, key decisions, and extension points to guide future development. Keep it concise and updated as the app evolves.

## Goals & Scope
- Single‑page Svelte app to plan yearly vacations for Germany (configurable region/Bundesland; default Saxony).
- Fast, resilient UI with offline‑friendly fallbacks (no backend).
- All 12 months visible without scrolling; clear states for holidays, bridge days, weekends, vacation; optional school holiday highlight.

## Architecture Overview
- Composition
  - `App.svelte`: shell, header (locale/year), layout, includes Legend, Calendar, VacationManager.
  - `components/Calendar.svelte`: 3×4 month grid.
  - `components/MonthView.svelte`: one month; weekday header + day grid.
  - `components/DayCell.svelte`: single day state + selection; visual states for holidays, bridge days, school holidays, weekends, vacation (green).
  - `components/VacationManager.svelte`: allocation, remaining, selected list (table), prominent reset.
  - `components/AutoPlan.svelte`: automatic planner with preview variants and parameters.
  - `components/LocaleSwitcher.svelte`: DE/EN toggle.
  - `components/RegionSelector.svelte`: German state selector.
  
- State (Svelte stores)
  - `stores/year.ts`: selected year.
  - `stores/vacation.ts`: total days, selected dates, derived remaining (persisted).
  - `stores/locale.ts`: UI locale with localStorage persistence.
  - `stores/region.ts`: selected German region.
  - `stores/holidays.ts`: holidays/bridge days derived from network fetch; loading/error state.
  - `stores/autoPlanner.ts`: auto‑planning parameters (bridge toggle, max weeks, even spread, ignore months, school holidays).
- Utilities
  - `lib/date.ts`: ISO formatting, month iteration, helpers.
  - `lib/holidays.ts`: Saxony holidays + bridge‑day rules; `bridgeDaysFromHolidays`.
  - `lib/holidays_fetch.ts`: fetch regional holidays with memory + localStorage cache and fallbacks.
  - `lib/i18n.ts`: month/weekday names, date formatting.
  - `lib/auto_planner.ts`: anchor‑first long‑break planner with variants, even spread, ignore months, bridge‑day toggle, one max‑week occurrence, greedy fill.
  - `lib/school_holidays.ts`: placeholder provider for school holiday periods per region.
  

## Key Decisions
- Region & holidays:
  - Runtime fetching from feiertage-api.de per Bundesland; cached (mem + localStorage).
  - Robust fallbacks: Saxony built‑in or national common holidays if network fails.
  - Bridge days computed from the active holidays map (Mon/Fri/Tue/Thu/Wed rules; skip weekends, same‑year only).
- Layout:
  - 3×4 grid; compact typography; `auto-rows-fr` day grid for equal cell heights. Sidebar hidden below `lg` to keep no‑scroll guarantee.
- Styling:
  - Tailwind with Material‑inspired tokens and system‑driven dark mode; vacation = green for clear affordance.
- Accessibility:
  - `focus-visible` rings, adequate contrast, ARIA roles for calendar grid/headers, descriptive localized `aria-label` per day; respects `prefers-reduced-motion`.
- Localization:
  - Default `de-DE`; switcher to `en-US`. Dates via `Intl`.

 

## Extension Points
- Regions/Holidays:
  - Add service adapters or local calculators; support additional countries.
- Persistence:
  - Persist planner settings and preview; add schema versioning.
- Export/Share:
  - Generate CSV/ICS, or shareable URLs (e.g., compress ISO selections into hash params).
- Density & Zoom:
  - Provide compact/comfortable density toggle; breakpoints for 2×6 or 1×12 views.
- Tests/CI:
  - Add component and E2E tests (Playwright); integrate into GitHub Actions.

## Testing
- Framework: Vitest.
- Suites:
  - `tests/date.test.ts` — date utilities.
  - `tests/holidays.test.ts` — Saxony date rules and bridge day example.
  - `tests/holidays_fetch.test.ts` — network fallback behavior.
  - `tests/i18n.test.ts` — i18n helpers.
  - `tests/auto_planner*.test.ts` — planner behavior (long breaks, ignore months, bridge toggle, school holidays, greedy fill).
- Coverage: `npm run test:coverage` (v8). Thresholds ≥60% lines/statements/functions, 50% branches on `src/lib/**`.

## Coding Guidelines
- SRP: each component handles one concern; keep logic in `lib/*` or stores.
- Types: prefer explicit types for store values and function returns.
- Naming: kebab‑case files; PascalCase Svelte components; `*.types.ts` for shared types.
- Styling: use Tailwind utility classes; centralize tokens in config or `app.css`.
- Conditionals: avoid “elvis”/ternary (`a ? b : c`) and nullish coalescing (`??`) in TS; prefer explicit `if` statements for readability. In Svelte templates, favor `{#if}{:else}` blocks over inline ternaries.

## Known Trade‑offs
- Bridge day rules are heuristic; may need regional/company overrides.
- No timezone handling beyond local; ISO keys use local date boundaries.
 - Planner is heuristic (fast) vs. optimal; consider ILP/CP-SAT for strict constraints.

## Deployment
- GitHub Pages via Actions; Vite `base` must match repo name. SPA fallback at `public/404.html`.
