export type SchoolHoliday = { start: Date; end: Date; name: string };

// Placeholder provider for German school holidays by region. For now, returns a minimal
// set or an empty list if unknown. Extend/replace with real data as needed.
export function getSchoolHolidays(year: number, region: string): SchoolHoliday[] {
  // Example minimal anchors for Saxony (SN). Please replace with authoritative data.
  if (region === 'SN') {
    return [
      // Winterferien (approx)
      { start: new Date(year, 1, 10), end: new Date(year, 1, 15), name: 'Winterferien' },
      // Osterferien (approx)
      { start: new Date(year, 3, 14), end: new Date(year, 3, 21), name: 'Osterferien' },
      // Sommerferien (approx Jul–Aug window)
      { start: new Date(year, 6, 7), end: new Date(year, 7, 17), name: 'Sommerferien' },
      // Herbstferien (approx)
      { start: new Date(year, 9, 13), end: new Date(year, 9, 25), name: 'Herbstferien' },
      // Weihnachtsferien (approx)
      { start: new Date(year, 11, 22), end: new Date(year + 1, 0, 4), name: 'Weihnachtsferien' },
    ];
  }
  return [];
}

// Memoized helper to get a Set of ISO dates for school holidays
const schoolDaysCache = new Map<string, Set<string>>();
export function getSchoolDaysSet(year: number, region: string): Set<string> {
  const key = `${year}-${region}`;
  const cached = schoolDaysCache.get(key);
  if (cached) return cached;
  const ranges = getSchoolHolidays(year, region);
  const set = new Set<string>();
  for (const range of ranges) {
    const current = new Date(range.start);
    while (current <= range.end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      set.add(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
  }
  schoolDaysCache.set(key, set);
  return set;
}
