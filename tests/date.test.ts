import { describe, it, expect } from 'vitest';
import { toISODate, isWeekend, daysInMonth } from '../src/lib/date';

describe('date utils', () => {
  it('formats ISO date correctly', () => {
    const d = new Date(2025, 0, 5); // Jan 5
    expect(toISODate(d)).toBe('2025-01-05');
  });
  it('detects weekends', () => {
    // 2025-01-05 is Sunday
    expect(isWeekend(new Date(2025, 0, 5))).toBe(true);
    // 2025-01-06 is Monday
    expect(isWeekend(new Date(2025, 0, 6))).toBe(false);
  });
  it('provides days in month', () => {
    expect(daysInMonth(2024, 1).length).toBe(29); // Feb leap year
    expect(daysInMonth(2025, 1).length).toBe(28);
    expect(daysInMonth(2025, 3).length).toBe(30);
  });
});

