import { describe, it, expect } from 'vitest';
import { generateAutoPlan, generateAutoPlanDetailed, buildScheduleFromSelection } from '../src/lib/auto_planner';
import { holidaysForYear, bridgeDaysFromHolidays } from '../src/lib/holidays';

function monthOf(iso: string) {
  return new Date(iso).getMonth();
}

describe('auto planner advanced behaviors', () => {
  const year = 2025;
  const holidays = holidaysForYear(year);
  const bridges = bridgeDaysFromHolidays(year, holidays);

  it('generates at least one long (>=7 days) vacation block in the schedule', () => {
    const budget = 14;
    const days = generateAutoPlan({
      year,
      budget,
      holidays,
      bridgeDays: bridges,
      settings: {
        useBridgeDays: true,
        maxConsecutiveVacationWeeks: 2,
        maxConsecutiveWorkWeeks: 8,
        preferEvenSpread: true,
      },
    });
    const schedule = buildScheduleFromSelection(year, holidays, days);
    const hasLong = schedule.some(e => e.durationDays >= 7);
    expect(hasLong).toBe(true);
  });

  it('respects ignored months (July, August) for selection', () => {
    const budget = 10;
    const days = generateAutoPlan({
      year,
      budget,
      holidays,
      bridgeDays: bridges,
      settings: {
        useBridgeDays: true,
        maxConsecutiveVacationWeeks: 2,
        maxConsecutiveWorkWeeks: 8,
        preferEvenSpread: true,
        ignoredMonths: [6, 7],
      },
    });
    for (const iso of days) {
      const m = monthOf(iso);
      expect([6, 7].includes(m)).toBe(false);
    }
  });

  it('respects ignored month January including cross-month windows', () => {
    const budget = 8;
    const days = generateAutoPlan({
      year,
      budget,
      holidays,
      bridgeDays: bridges,
      settings: {
        useBridgeDays: true,
        maxConsecutiveVacationWeeks: 2,
        maxConsecutiveWorkWeeks: 8,
        preferEvenSpread: true,
        ignoredMonths: [0],
      },
    });
    for (const iso of days) {
      const m = monthOf(iso);
      expect(m).not.toBe(0);
    }
  });

  it('does not select bridge days when disabled', () => {
    const budget = 10;
    const days = generateAutoPlan({
      year,
      budget,
      holidays,
      bridgeDays: bridges,
      settings: {
        useBridgeDays: false,
        maxConsecutiveVacationWeeks: 2,
        maxConsecutiveWorkWeeks: 8,
        preferEvenSpread: true,
      },
    });
    for (const iso of days) {
      expect(bridges.has(iso)).toBe(false);
    }
  });

  it('uses the full budget when feasible (greedy fill)', () => {
    const budget = 12;
    const detailed = generateAutoPlanDetailed({
      year,
      budget,
      holidays,
      bridgeDays: bridges,
      settings: {
        useBridgeDays: true,
        maxConsecutiveVacationWeeks: 2,
        maxConsecutiveWorkWeeks: 8,
        preferEvenSpread: true,
      },
    });
    // In normal German calendar, using all 12 should be feasible
    expect(detailed.summary.usedVacationDays).toBeLessThanOrEqual(budget);
    // Try to be assertive: expect close-to-budget usage (>= 10)
    expect(detailed.summary.usedVacationDays).toBeGreaterThanOrEqual(10);
  });

  it('can prefer school holidays when provided', () => {
    const budget = 10;
    const school = [
      { start: new Date(year, 6, 15), end: new Date(year, 6, 31), name: 'Sommerferien (test)' },
    ];
    const detailed = generateAutoPlanDetailed({
      year,
      budget,
      holidays,
      bridgeDays: bridges,
      settings: {
        useBridgeDays: true,
        maxConsecutiveVacationWeeks: 2,
        maxConsecutiveWorkWeeks: 8,
        preferEvenSpread: false,
        respectSchoolHolidays: true,
      },
      schoolHolidays: school,
    });
    // At least one entry should overlap with school holiday window
    const overlaps = detailed.schedule.some(e => {
      const s = new Date(e.startISO).getTime();
      const t = new Date(e.endISO).getTime();
      const a = school[0].start.getTime();
      const b = school[0].end.getTime();
      const ov = Math.max(0, Math.min(t, b) - Math.max(s, a));
      return ov > 0;
    });
    expect(overlaps).toBe(true);
  });
});
