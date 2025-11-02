import type { GermanRegion } from '../stores/region';
import { toISODate } from './date';

// Fetch holidays for German federal states. Primary API: feiertage-api.de
// Example: https://feiertage-api.de/api/?jahr=2025&nur_land=SN
// Returns { "Neujahr": { "datum": "2025-01-01", ... }, ... }

const memCache = new Map<string, Map<string, string>>();

export async function fetchHolidaysForGermanRegion(year: number, regionCode: GermanRegion): Promise<Map<string, string>> {
  const key = `${year}-${regionCode}`;
  if (memCache.has(key)) return memCache.get(key)!;
  try {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(`holidays:${key}`) : null;
    if (cached) {
      const parsed = new Map<string, string>(Object.entries(JSON.parse(cached)) as [string, string][]);
      memCache.set(key, parsed);
      return parsed;
    }
  } catch {}

  const map = new Map<string, string>();
  try {
    const url = `https://feiertage-api.de/api/?jahr=${year}&nur_land=${regionCode}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const [name, obj] of Object.entries<any>(data)) {
      const iso = obj?.datum as string | undefined;
      if (iso) map.set(iso, name);
    }
    if (map.size > 0) {
      memCache.set(key, map);
      try { localStorage.setItem(`holidays:${key}`, JSON.stringify(Object.fromEntries(map))); } catch {}
      return map;
    }
  } catch (e) {
    // ignore and fallback below
  }

  // Fallback: built-in Saxony calculator if SN, otherwise national common holidays
  const fallback = fallbackHolidaysForRegion(year, regionCode);
  memCache.set(key, fallback);
  return fallback;
}

export function fallbackHolidaysForRegion(year: number, region: GermanRegion): Map<string, string> {
  const easterDate = easterSunday(year);
  const list: { date: Date; name: string }[] = [
    { date: new Date(year, 0, 1), name: 'Neujahr' },
    { date: addDays(easterDate, -2), name: 'Karfreitag' },
    { date: addDays(easterDate, 1), name: 'Ostermontag' },
    { date: new Date(year, 4, 1), name: 'Tag der Arbeit' },
    { date: addDays(easterDate, 39), name: 'Christi Himmelfahrt' },
    { date: addDays(easterDate, 50), name: 'Pfingstmontag' },
    { date: new Date(year, 9, 3), name: 'Tag der Deutschen Einheit' },
    { date: new Date(year, 11, 25), name: '1. Weihnachtsfeiertag' },
    { date: new Date(year, 11, 26), name: '2. Weihnachtsfeiertag' },
  ];

  const add = (date: Date, name: string) => {
    list.push({ date, name });
  };

  // Regional additions
  if (['BW', 'BY', 'ST'].includes(region)) add(new Date(year, 0, 6), 'Heilige Drei Könige');
  if (['BE', 'MV'].includes(region)) add(new Date(year, 2, 8), 'Internationaler Frauentag');
  if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(region)) add(addDays(easterDate, 60), 'Fronleichnam');
  if (region === 'SL') add(new Date(year, 7, 15), 'Mariä Himmelfahrt');
  if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(region)) add(new Date(year, 10, 1), 'Allerheiligen');
  if (['BB', 'MV', 'SN', 'ST', 'TH', 'SH', 'NI', 'HB', 'HH'].includes(region)) add(new Date(year, 9, 31), 'Reformationstag');
  if (region === 'TH') add(new Date(year, 8, 20), 'Weltkindertag');
  if (region === 'SN') add(repentanceDay(year), 'Buß- und Bettag');

  const result = new Map<string, string>();
  for (const holiday of list) {
    result.set(toISODate(holiday.date), holiday.name);
  }
  return result;
}

// Utilities duplicated to avoid circular import issues
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function repentanceDay(year: number): Date {
  const d = new Date(year, 10, 22);
  while (d.getDay() !== 3) d.setDate(d.getDate() - 1);
  return d;
}
