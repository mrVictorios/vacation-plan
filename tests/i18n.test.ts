import { describe, it, expect } from 'vitest';
import { weekdayShortNames, monthLongName, formatDateGerman } from '../src/lib/i18n';

describe('i18n helpers', () => {
  it('returns 7 weekday short names starting Monday (de-DE)', () => {
    const names = weekdayShortNames('de-DE');
    expect(names.length).toBe(7);
    // In de-DE, Monday usually starts with "Mo"
    expect(names[0].toLowerCase().startsWith('mo')).toBe(true);
  });

  it('formats month long name correctly', () => {
    const name = monthLongName(2025, 0, 'de-DE');
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(2);
  });

  it('formats dates in German style', () => {
    const d = new Date(2025, 1, 3); // 03.02.2025
    const s = formatDateGerman(d, 'de-DE');
    expect(s.includes('.')).toBe(true);
  });
});

