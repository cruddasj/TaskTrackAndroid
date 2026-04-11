import { getStalePomodoroSessionId } from './pomodoroNotificationScheduling';

describe('getStalePomodoroSessionId', () => {
  it('returns previous session id when session changes', () => {
    expect(getStalePomodoroSessionId(101, 202)).toBe(101);
  });

  it('returns undefined when there is no previous id', () => {
    expect(getStalePomodoroSessionId(null, 202)).toBeUndefined();
  });

  it('returns undefined when session id has not changed', () => {
    expect(getStalePomodoroSessionId(101, 101)).toBeUndefined();
  });
});
