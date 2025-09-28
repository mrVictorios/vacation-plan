import { derived, writable } from 'svelte/store';

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

// Total vacation days user has available
const initialTotal = (() => {
  const v = safeGet('totalDays');
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 30;
})();
export const totalDays = writable<number>(initialTotal);
totalDays.subscribe((v) => safeSet('totalDays', String(v)));

// Selected vacation dates as ISO strings (YYYY-MM-DD)
const initialSelected = (() => {
  const raw = safeGet('vacationDays');
  if (!raw) return new Set<string>();
  try {
    const arr = JSON.parse(raw) as string[];
    if (Array.isArray(arr)) return new Set(arr);
  } catch {}
  return new Set<string>();
})();
export const vacationDays = writable<Set<string>>(initialSelected);
vacationDays.subscribe((set) => safeSet('vacationDays', JSON.stringify(Array.from(set))));

// Remaining vacation days derived from selection
export const remainingDays = derived([totalDays, vacationDays], ([t, s]) => Math.max(0, t - s.size));

// Toggle a vacation date
export function toggleVacation(iso: string) {
  vacationDays.update((s) => {
    const next = new Set(s);
    if (next.has(iso)) next.delete(iso); else next.add(iso);
    return next;
  });
}

// Clear all selected vacation days
export function clearAll() {
  vacationDays.set(new Set());
}
