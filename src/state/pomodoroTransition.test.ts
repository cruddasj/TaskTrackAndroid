import { AppState } from '../types';
import { getNextPomodoroPhase, getRoundProgressionForPhaseAdvance } from './pomodoroTransition';

const buildState = (overrides: Partial<AppState> = {}): AppState => ({
  userName: '',
  categories: ['Work'],
  tasks: [],
  taskBank: [],
  rounds: [],
  settings: {
    pomodoroMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    sessionReviewGraceSeconds: 60,
    alarmTone: 'bell',
    alarmRepeatCount: 3,
    showFirstTimeGuidance: true,
  },
  pomodoro: {
    isRunning: true,
    startedAt: 1,
    remainingSeconds: 10,
    totalSeconds: 1500,
    phase: 'work',
    completedWorkSessions: 0,
    activeTaskId: undefined,
    activeRoundId: 'r1',
  },
  ...overrides,
});

describe('pomodoro transition helpers', () => {
  it('returns break phase when the current phase is work', () => {
    const nextPhase = getNextPomodoroPhase(buildState());

    expect(nextPhase).toBe('short_break');
  });

  it('returns work when transitioning from a break', () => {
    const nextPhase = getNextPomodoroPhase(
      buildState({
        pomodoro: {
          isRunning: true,
          startedAt: 1,
          remainingSeconds: 0,
          totalSeconds: 300,
          phase: 'short_break',
          completedWorkSessions: 1,
          activeTaskId: undefined,
          activeRoundId: 'r2',
        },
      }),
    );

    expect(nextPhase).toBe('work');
  });

  it('advances rounds immediately when leaving a work phase', () => {
    const progression = getRoundProgressionForPhaseAdvance(
      buildState({
        rounds: [
          { id: 'r1', title: 'Round 1', scheduledTime: '09:00', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
          { id: 'r2', title: 'Round 2', scheduledTime: '10:00', durationMinutes: 25, taskIds: ['t2'], status: 'upcoming' },
        ],
      }),
    );

    expect(progression?.nextRoundId).toBe('r2');
    expect(progression?.rounds.find((round) => round.id === 'r1')?.status).toBe('done');
    expect(progression?.rounds.find((round) => round.id === 'r2')?.status).toBe('active');
  });

  it('does not modify rounds while moving from break to work', () => {
    const progression = getRoundProgressionForPhaseAdvance(
      buildState({
        rounds: [
          { id: 'r1', title: 'Round 1', scheduledTime: '09:00', durationMinutes: 25, taskIds: ['t1'], status: 'done' },
          { id: 'r2', title: 'Round 2', scheduledTime: '10:00', durationMinutes: 25, taskIds: ['t2'], status: 'active' },
        ],
        pomodoro: {
          isRunning: true,
          startedAt: 1,
          remainingSeconds: 0,
          totalSeconds: 300,
          phase: 'short_break',
          completedWorkSessions: 1,
          activeTaskId: undefined,
          activeRoundId: 'r2',
        },
      }),
    );

    expect(progression).toBeUndefined();
  });
});
