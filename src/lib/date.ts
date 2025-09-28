// Small date utilities used by the calendar

export function toISODate(d: Date): string {
  // Format as YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay(); // 0=Sun,6=Sat
  return day === 0 || day === 6;
}

export function daysInMonth(year: number, month: number): Date[] {
  const result: Date[] = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= last; i++) {
    result.push(new Date(year, month, i));
  }
  return result;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

