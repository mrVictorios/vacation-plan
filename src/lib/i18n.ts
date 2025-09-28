import { get } from 'svelte/store';
import { locale } from '../stores/locale';

export function weekdayShortNames(loc = get(locale)): string[] {
  // Start week on Monday as in Germany
  const startMonday = new Date(Date.UTC(2021, 0, 4)); // 2021-01-04 is a Monday
  const fmt = new Intl.DateTimeFormat(loc, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(startMonday.getTime() + i * 86400000)));
}

export function monthLongName(year: number, month: number, loc = get(locale)): string {
  return new Intl.DateTimeFormat(loc, { month: 'long' }).format(new Date(year, month, 1));
}

export function formatDateGerman(d: Date, loc = get(locale)): string {
  return new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

