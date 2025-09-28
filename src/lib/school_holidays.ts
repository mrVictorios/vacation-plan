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

