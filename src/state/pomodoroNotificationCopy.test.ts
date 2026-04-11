import { getPomodoroCompletionNotificationCopy } from './pomodoroNotificationCopy';

describe('getPomodoroCompletionNotificationCopy', () => {
  it('uses focus-session wording when work ends with unfinished tasks in the active round', () => {
    expect(getPomodoroCompletionNotificationCopy('work', false)).toEqual({
      title: 'Focus session complete',
      body: 'Focus session complete. Your break is ready to start.',
    });
  });

  it('uses round-complete wording when work ends and the active round is finished', () => {
    expect(getPomodoroCompletionNotificationCopy('work', true)).toEqual({
      title: 'Focus session complete',
      body: 'Round complete. Your break is ready to start.',
    });
  });

  it('keeps existing short-break completion copy', () => {
    expect(getPomodoroCompletionNotificationCopy('short_break', false)).toEqual({
      title: 'Short break complete',
      body: 'Back to focus mode.',
    });
  });
});
