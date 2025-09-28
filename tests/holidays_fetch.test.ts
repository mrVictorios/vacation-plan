import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchHolidaysForGermanRegion } from '../src/lib/holidays_fetch';

afterEach(() => {
  vi.resetAllMocks();
});

describe('holidays_fetch fallback', () => {
  it('falls back to Saxony built-in holidays on fetch error', async () => {
    // Mock fetch to reject
    // @ts-expect-error - global fetch in Node test env
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    const map = await fetchHolidaysForGermanRegion(2025, 'SN');
    expect(map.size).toBeGreaterThan(0);
    // Should contain Buß- und Bettag
    const hasRepent = Array.from(map.values()).includes('Buß- und Bettag');
    expect(hasRepent).toBe(true);
  });

  it('returns common Germany fallback for other regions on fetch error', async () => {
    // @ts-expect-error - global fetch in Node test env
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    const map = await fetchHolidaysForGermanRegion(2025, 'BE');
    expect(map.size).toBeGreaterThan(0);
    // Should contain Neujahr
    const hasNewYear = Array.from(map.values()).includes('Neujahr');
    expect(hasNewYear).toBe(true);
  });
});

