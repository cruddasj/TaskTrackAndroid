import type { PomodoroState } from '../types';

export const getPomodoroCompletionNotificationCopy = (
  phase: PomodoroState['phase'],
  completedRound: boolean,
): { title: string; body: string } => {
  if (phase === 'work') {
    return {
      title: 'Focus session complete',
      body: completedRound
        ? 'Round complete. Your break is ready to start.'
        : 'Focus session complete. Your break is ready to start.',
    };
  }

  if (phase === 'short_break') {
    return {
      title: 'Short break complete',
      body: 'Back to focus mode.',
    };
  }

  return {
    title: 'Long break complete',
    body: 'Great work. Start your next focus session.',
  };
};
