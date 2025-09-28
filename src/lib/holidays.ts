import { addDays, toISODate } from './date';

// Compute Easter Sunday using Anonymous Gregorian algorithm
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
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function iso(d: Date): string { return toISODate(d); }

function fixed(year: number, month: number, day: number) {
  return new Date(year, month, day);
}

// Buß- und Bettag: Wednesday before Nov 23 (between Nov 16–22)
function repentanceDay(year: number): Date {
  const d = new Date(year, 10, 22); // Nov 22
  while (d.getDay() !== 3) d.setDate(d.getDate() - 1);
  return d;
}

// Public holidays for Saxony (SN), Germany
export function holidaysForYear(year: number): Map<string, string> {
  const E = easterSunday(year);
  const list: { date: Date; name: string }[] = [
    { date: fixed(year, 0, 1), name: 'Neujahr' },
    { date: addDays(E, -2), name: 'Karfreitag' },
    { date: addDays(E, 1), name: 'Ostermontag' },
    { date: fixed(year, 4, 1), name: 'Tag der Arbeit' },
    { date: addDays(E, 39), name: 'Christi Himmelfahrt' },
    { date: addDays(E, 50), name: 'Pfingstmontag' },
    { date: fixed(year, 9, 3), name: 'Tag der Deutschen Einheit' },
    { date: fixed(year, 9, 31), name: 'Reformationstag' },
    { date: repentanceDay(year), name: 'Buß- und Bettag' },
    { date: fixed(year, 11, 25), name: '1. Weihnachtsfeiertag' },
    { date: fixed(year, 11, 26), name: '2. Weihnachtsfeiertag' },
  ];

  const map = new Map<string, string>();
  for (const h of list) { map.set(toISODate(h.date), h.name); }
  return map;
}

// Bridge days according to common German practice
// - If holiday on Tuesday -> Monday is bridge
// - If on Thursday -> Friday is bridge
// - If on Wednesday -> Tuesday and Thursday are bridge
// - If on Monday -> previous Friday is bridge (same year only)
// - If on Friday -> next Monday is bridge (same year only)
export function bridgeDaysForYear(year: number): Set<string> {
  const holidays = holidaysForYear(year);
  const bridges = new Set<string>();

  const withinYear = (d: Date) => d.getFullYear() === year;
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  for (const [isoDate] of holidays) {
    const d = dateFromISO(isoDate);
    const wd = d.getDay(); // 0=Sun..6=Sat
    // skip weekend holidays
    if (wd === 0 || wd === 6) continue;

    const maybeAdd = (x: Date) => {
      const key = toISODate(x);
      if (!withinYear(x)) return;
      if (isWeekend(x)) return;
      if (holidays.has(key)) return;
      bridges.add(key);
    };

    if (wd === 2) {
      // Tuesday -> Monday
      maybeAdd(addDays(d, -1));
    } else if (wd === 4) {
      // Thursday -> Friday
      maybeAdd(addDays(d, 1));
    } else if (wd === 3) {
      // Wednesday -> Tuesday & Thursday
      maybeAdd(addDays(d, -1));
      maybeAdd(addDays(d, 1));
    } else if (wd === 1) {
      // Monday -> previous Friday
      maybeAdd(addDays(d, -3));
    } else if (wd === 5) {
      // Friday -> next Monday
      maybeAdd(addDays(d, 3));
    }
  }

  return bridges;
}

// Compute bridge days from an arbitrary holidays set
export function bridgeDaysFromHolidays(year: number, holidays: Map<string, string>): Set<string> {
  const bridges = new Set<string>();
  const withinYear = (d: Date) => d.getFullYear() === year;
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
  const maybeAdd = (x: Date) => {
    const key = toISODate(x);
    if (!withinYear(x)) return;
    if (isWeekend(x)) return;
    if (holidays.has(key)) return;
    bridges.add(key);
  };
  for (const [isoDate] of holidays) {
    const d = dateFromISO(isoDate);
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    if (wd === 2) maybeAdd(addDays(d, -1));
    else if (wd === 4) maybeAdd(addDays(d, 1));
    else if (wd === 3) { maybeAdd(addDays(d, -1)); maybeAdd(addDays(d, 1)); }
    else if (wd === 1) maybeAdd(addDays(d, -3));
    else if (wd === 5) maybeAdd(addDays(d, 3));
  }
  return bridges;
}

function dateFromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
