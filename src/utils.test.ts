import { getDateKeyWithOffset, getTodayKey, getTomorrowKey } from './utils';

describe('date key helpers', () => {
  it('uses local calendar components for today key', () => {
    const baseDate = new Date(2026, 3, 10, 23, 45, 0, 0);

    expect(getTodayKey(baseDate)).toBe('2026-04-10');
  });

  it('computes date keys with offsets from a provided base date', () => {
    const baseDate = new Date(2026, 3, 10, 23, 45, 0, 0);

    expect(getDateKeyWithOffset(1, baseDate)).toBe('2026-04-11');
    expect(getTomorrowKey(baseDate)).toBe('2026-04-11');
  });

  it('handles month boundaries when computing tomorrow key', () => {
    const baseDate = new Date(2026, 0, 31, 8, 0, 0, 0);

    expect(getTomorrowKey(baseDate)).toBe('2026-02-01');
  });
});
