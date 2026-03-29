import { getGreeting } from './greeting';

describe('getGreeting', () => {
  it('returns afternoon at 6pm', () => {
    expect(getGreeting(18)).toBe('Good afternoon');
  });

  it('returns evening at 7pm', () => {
    expect(getGreeting(19)).toBe('Good evening');
  });
});
