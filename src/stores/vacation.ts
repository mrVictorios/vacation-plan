import { derived, writable } from 'svelte/store';

// Total vacation days user has available
export const totalDays = writable<number>(30);

// Selected vacation dates as ISO strings (YYYY-MM-DD)
export const vacationDays = writable<Set<string>>(new Set());

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

