import { describe, it, expect } from 'vitest';
import { holidaysForYear, bridgeDaysForYear, bridgeDaysFromHolidays } from '../src/lib/holidays';

describe('holidays (Saxony)', () => {
  it('includes Buß- und Bettag as a Wednesday before Nov 23', () => {
    const year = 2025;
    const map = holidaysForYear(year);
    const entry = Array.from(map.entries()).find(([, name]) => name === 'Buß- und Bettag');
    expect(entry).toBeTruthy();
    const [iso] = entry!;
    const d = new Date(iso);
    expect(d.getFullYear()).toBe(year);
    expect(d.getMonth()).toBe(10); // November
    expect(d.getDay()).toBe(3); // Wednesday
    expect(d.getDate()).toBeLessThan(23);
    expect(d.getDate()).toBeGreaterThanOrEqual(16);
  });

  it('computes bridge days around Thursday holidays (Ascension -> Friday)', () => {
    const year = 2025;
    const map = holidaysForYear(year);
    // Ascension Day 2025 is 2025-05-29 (Thu). Bridge should include 2025-05-30 (Fri)
    const bridges = bridgeDaysFromHolidays(year, map);
    expect(bridges.has('2025-05-30')).toBe(true);
  });
});

