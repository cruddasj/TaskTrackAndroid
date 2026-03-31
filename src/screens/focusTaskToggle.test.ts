import { canMarkTaskDone } from './focusTaskToggle';

describe('canMarkTaskDone', () => {
  it('returns false when session has not started or is paused', () => {
    expect(canMarkTaskDone(false)).toBe(false);
  });

  it('returns true when session is actively running', () => {
    expect(canMarkTaskDone(true)).toBe(true);
  });
});
