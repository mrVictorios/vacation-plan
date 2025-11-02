import { writable } from 'svelte/store';

export type Density = 'compact' | 'comfortable';
export type ThemeMode = 'system' | 'light' | 'dark';

function safeGet(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }

const initialDensity = (() => {
  const v = safeGet('ui:density');
  if (v === 'compact' || v === 'comfortable') return v as Density;
  return 'comfortable';
})();
export const density = writable<Density>(initialDensity);
density.subscribe((v) => safeSet('ui:density', v));

const initialTheme = (() => {
  const v = safeGet('ui:theme');
  if (v === 'light' || v === 'dark' || v === 'system') return v as ThemeMode;
  return 'system';
})();
export const themeMode = writable<ThemeMode>(initialTheme);
themeMode.subscribe((v) => safeSet('ui:theme', v));

// Calendar zoom scale (1.0 = 100%)
const initialScale = (() => {
  const v = safeGet('ui:calendarScale');
  const n = v ? Number(v) : NaN;
  // clamp to allowed range (0.5..2)
  if (Number.isFinite(n) && n > 0.5 && n <= 2) return n;
  return 1;
})();
export const calendarScale = writable<number>(initialScale);
calendarScale.subscribe((v) => safeSet('ui:calendarScale', String(v)));

// Active sidebar tab persistence
export type SidebarTab = 'vacation' | 'auto' | 'share' | 'changelog';
const initialTab = (() => {
  const v = safeGet('ui:tab');
  if (v === 'vacation' || v === 'auto' || v === 'share' || v === 'changelog') return v as SidebarTab;
  return 'vacation';
})();
export const activeSidebarTab = writable<SidebarTab>(initialTab);
activeSidebarTab.subscribe((v) => safeSet('ui:tab', v));
