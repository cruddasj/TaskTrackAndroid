import { getRemainingSecondsFromClock } from './pomodoroClock';

describe('getRemainingSecondsFromClock', () => {
  it('returns total seconds when timer has no started timestamp', () => {
    expect(getRemainingSecondsFromClock(null, 1500, 1000)).toBe(1500);
  });

  it('calculates remaining time from elapsed wall clock time', () => {
    expect(getRemainingSecondsFromClock(1_000, 1_500, 1_000 + 6 * 60 * 1000)).toBe(1_140);
  });

  it('never returns negative seconds after timer end', () => {
    expect(getRemainingSecondsFromClock(1_000, 60, 1_000 + 120_000)).toBe(0);
  });
});
