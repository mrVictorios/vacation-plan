import { writable } from 'svelte/store';

function safeGet(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }

const initialYear = (() => {
  const v = safeGet('ui:year');
  const n = v ? Number(v) : NaN;
  if (Number.isFinite(n) && n >= 1970 && n <= 9999) return Math.floor(n);
  return new Date().getFullYear();
})();

// Year selector store (persisted)
export const currentYear = writable<number>(initialYear);
currentYear.subscribe((v) => safeSet('ui:year', String(v)));
