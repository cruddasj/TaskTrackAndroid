import { AppState, PomodoroState } from '../types';
import { advanceActiveRound } from './rounds';

export const getNextPomodoroPhase = (state: AppState): PomodoroState['phase'] => {
  if (state.pomodoro.phase !== 'work') return 'work';
  const completedWorkSessions = state.pomodoro.completedWorkSessions + 1;
  return completedWorkSessions % state.settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break';
};

export const getRoundProgressionForPhaseAdvance = (state: AppState) =>
  state.pomodoro.phase === 'work' ? advanceActiveRound(state.rounds, state.pomodoro.activeRoundId) : undefined;
