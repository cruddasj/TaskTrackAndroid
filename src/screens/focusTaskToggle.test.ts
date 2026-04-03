import { canMarkTaskDone, getMarkTaskDoneBlockedMessage } from './focusTaskToggle';

describe('canMarkTaskDone', () => {
  it('returns false when session has not started or is paused', () => {
    expect(canMarkTaskDone(false)).toBe(false);
  });

  it('returns true when session is actively running', () => {
    expect(canMarkTaskDone(true)).toBe(true);
  });
});

describe('getMarkTaskDoneBlockedMessage', () => {
  it('returns guidance copy when marking done is blocked', () => {
    expect(getMarkTaskDoneBlockedMessage(false)).toBe('Start or resume the timer to mark tasks as done.');
  });

  it('returns null when marking done is allowed', () => {
    expect(getMarkTaskDoneBlockedMessage(true)).toBeNull();
  });
});
