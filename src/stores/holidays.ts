import { writable } from 'svelte/store';
import { fetchHolidaysForGermanRegion } from '../lib/holidays_fetch';
import type { GermanRegion } from './region';
import { holidaysForYear } from '../lib/holidays';

export const holidaysStore = writable<Map<string, string>>(new Map());
export const bridgeDaysStore = writable<Set<string>>(new Set());
export const loadingHolidays = writable<boolean>(false);
export const holidaysError = writable<string | null>(null);

export async function loadHolidays(year: number, region: GermanRegion) {
  loadingHolidays.set(true);
  holidaysError.set(null);
  try {
    const map = await fetchHolidaysForGermanRegion(year, region);
    holidaysStore.set(map);
    // compute bridge days based on returned holidays
    const { bridgeDaysFromHolidays } = await import('../lib/holidays');
    bridgeDaysStore.set(bridgeDaysFromHolidays(year, map));
  } catch (e: any) {
    holidaysError.set(e?.message || 'Failed to load holidays');
    // fallback to built-in Saxony
    const map = holidaysForYear(year);
    holidaysStore.set(map);
    const { bridgeDaysFromHolidays } = await import('../lib/holidays');
    bridgeDaysStore.set(bridgeDaysFromHolidays(year, map));
  } finally {
    loadingHolidays.set(false);
  }
}

