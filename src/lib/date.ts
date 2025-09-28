// Small date utilities used by the calendar

export function toISODate(date: Date): string {
  // Format as YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0=Sun,6=Sat
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function daysInMonth(year: number, month: number): Date[] {
  const resultDates: Date[] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let dayNumber = 1; dayNumber <= lastDay; dayNumber++) {
    resultDates.push(new Date(year, month, dayNumber));
  }
  return resultDates;
}

export function addDays(date: Date, daysToAdd: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}
