import { writable } from 'svelte/store';
import { fetchHolidaysForGermanRegion, fallbackHolidaysForRegion } from '../lib/holidays_fetch';
import type { GermanRegion } from './region';

export const holidaysStore = writable<Map<string, string>>(new Map());
export const bridgeDaysStore = writable<Set<string>>(new Set());
export const loadingHolidays = writable<boolean>(false);
export const holidaysError = writable<string | null>(null);

export async function loadHolidays(year: number, region: GermanRegion, useRemote = true) {
  loadingHolidays.set(true);
  holidaysError.set(null);
  const { bridgeDaysFromHolidays } = await import('../lib/holidays');
  const applyAndCache = (map: Map<string, string>) => {
    holidaysStore.set(map);
    bridgeDaysStore.set(bridgeDaysFromHolidays(year, map));
  };

  if (!useRemote) {
    applyAndCache(fallbackHolidaysForRegion(year, region));
    loadingHolidays.set(false);
    return;
  }

  try {
    const map = await fetchHolidaysForGermanRegion(year, region);
    applyAndCache(map);
  } catch (e: any) {
    holidaysError.set(e?.message || 'Failed to load holidays');
    applyAndCache(fallbackHolidaysForRegion(year, region));
  } finally {
    loadingHolidays.set(false);
  }
}
