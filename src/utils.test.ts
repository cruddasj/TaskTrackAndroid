import { formatRemainingEndTime, normalizeOptionalDescription } from './utils';

describe('formatRemainingEndTime', () => {
  it('formats the end time in 24-hour hh:mm', () => {
    const now = new Date('2026-04-04T09:18:00');

    expect(formatRemainingEndTime(30 * 60, now)).toBe('09:48');
  });

  it('clamps negative seconds to the current time', () => {
    const now = new Date('2026-04-04T16:05:00');

    expect(formatRemainingEndTime(-120, now)).toBe('16:05');
  });
});

describe('normalizeOptionalDescription', () => {
  it('returns an empty string when description is blank', () => {
    expect(normalizeOptionalDescription('   ')).toBe('');
  });

  it('returns trimmed text when description is provided', () => {
    expect(normalizeOptionalDescription('  Plan next sprint  ')).toBe('Plan next sprint');
  });
});
