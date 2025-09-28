import { describe, it, expect } from 'vitest';
import { generateAutoPlan } from '../src/lib/auto_planner';
import { holidaysForYear, bridgeDaysFromHolidays } from '../src/lib/holidays';

describe('auto planner', () => {
  const year = 2025;
  const holidays = holidaysForYear(year);
  const bridges = bridgeDaysFromHolidays(year, holidays);

  it('respects budget and avoids holidays/weekends', () => {
    const budget = 12;
    const plan = generateAutoPlan({
      year,
      budget,
      holidays,
      bridgeDays: bridges,
      settings: {
        useBridgeDays: true,
        maxConsecutiveVacationWeeks: 2,
        maxConsecutiveWorkWeeks: 8,
      },
    });
    expect(plan.size).toBeLessThanOrEqual(budget);
    for (const iso of plan) {
      const d = new Date(iso);
      expect(d.getDay() === 0 || d.getDay() === 6).toBe(false);
      expect(holidays.has(iso)).toBe(false);
    }
  });
});

