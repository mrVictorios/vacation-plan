# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/` (feature‑oriented folders). Shared utilities go in `src/lib/`.
- Tests live in `tests/` mirroring `src/` paths (e.g., `src/plan/calc.ts` → `tests/plan/calc.test.ts`).
- Developer scripts in `scripts/` (Node/ Bash), documentation in `docs/`, static assets in `assets/`.
- Configuration templates belong in `.env.example`. Add new keys there and document in `docs/config.md`.

## Build, Test, and Development Commands
- Install: `npm ci` (or `pnpm i --frozen-lockfile`) — install exact locked deps.
- Develop: `npm run dev` — start local server or watcher.
- Test: `npm test` — run unit tests once; `npm run test:watch` for TDD.
- Lint: `npm run lint` and `npm run lint:fix` — report/fix style issues.
- Build: `npm run build` — produce production artifacts in `dist/`.
Note: If this repo uses a different stack, provide equivalent targets via package scripts or a `Makefile` with `make dev|test|lint|build`.

## Coding Style & Naming Conventions
- Use Prettier + ESLint defaults (2‑space indent, semicolons on, single quotes). Run `npm run lint:fix` before committing.
- File names: kebab‑case for files (`trip-planner.ts`), PascalCase for React components (`TripPlanner.tsx`).
- Export rule: one default per module; colocate types in the same file (`*.types.ts`) when small.

## Testing Guidelines
- Framework: Jest or Vitest with `@testing-library` for UI. Keep fast, deterministic tests.
- Layout: `tests/**` mirrors `src/**`. Name files `*.test.ts` or `*.spec.ts`.
- Coverage: target ≥80% lines on changed files. Run `npm run test:coverage`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits format — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`. Keep subject ≤72 chars.
- PRs: clear description, linked issue (`Closes #123`), screenshots for UI, and checklist: tests added/updated, docs updated, passing CI.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` (gitignored). Update `.env.example` when adding config.
- Validate external input and sanitize any user‑provided content.
- Keep dependencies current; prefer `npm audit fix --only=prod` for safe upgrades.
