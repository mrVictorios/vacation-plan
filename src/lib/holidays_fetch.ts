import type { GermanRegion } from '../stores/region';
import { holidaysForYear as holidaysSaxony } from './holidays';

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
  const fallback = regionCode === 'SN' ? holidaysSaxony(year) : commonGermany(year);
  memCache.set(key, fallback);
  return fallback;
}

// Minimal nationwide holidays (no regional-only days)
function commonGermany(year: number): Map<string, string> {
  const holidayList: { date: Date; name: string }[] = [];
  const easterDate = easterSunday(year);
  holidayList.push(
    { date: new Date(year, 0, 1), name: 'Neujahr' },
    { date: addDays(easterDate, -2), name: 'Karfreitag' },
    { date: addDays(easterDate, 1), name: 'Ostermontag' },
    { date: new Date(year, 4, 1), name: 'Tag der Arbeit' },
    { date: addDays(easterDate, 39), name: 'Christi Himmelfahrt' },
    { date: addDays(easterDate, 50), name: 'Pfingstmontag' },
    { date: new Date(year, 9, 3), name: 'Tag der Deutschen Einheit' },
    { date: new Date(year, 11, 25), name: '1. Weihnachtsfeiertag' },
    { date: new Date(year, 11, 26), name: '2. Weihnachtsfeiertag' },
  );
  const result = new Map<string, string>();
  for (const holiday of holidayList) result.set(holiday.date.toISOString().slice(0, 10), holiday.name);
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
