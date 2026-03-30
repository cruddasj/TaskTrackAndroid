import { formatFocusTimeSpent, getGreeting } from './greeting';

describe('getGreeting', () => {
  it('returns afternoon at 6pm', () => {
    expect(getGreeting(18)).toBe('Good afternoon');
  });

  it('returns evening at 7pm', () => {
    expect(getGreeting(19)).toBe('Good evening');
  });
});

describe('formatFocusTimeSpent', () => {
  it('returns only minutes when less than an hour has passed', () => {
    expect(formatFocusTimeSpent(45)).toBe('45m');
  });

  it('returns hours and minutes when at least an hour has passed', () => {
    expect(formatFocusTimeSpent(100)).toBe('1h 40m');
  });
});
