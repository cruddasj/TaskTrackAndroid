import { AppState } from '../types';
import { applyWorkPhaseRoundAdvance, getNextPomodoroPhase, getRoundProgressionForPhaseAdvance } from './pomodoroTransition';
import { getTodayKey } from '../utils';

const todayKey = getTodayKey();

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
    alarmVolume: 70,
    alarmRepeatCount: 3,
    showFirstTimeGuidance: true,
  },
  pomodoro: {
    sessionId: 101,
    startTime: 1,
    duration: 1500000,
    remaining: null,
    isPaused: false,
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
          sessionId: 102,
          startTime: 1,
          duration: 300000,
          remaining: null,
          isPaused: false,
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
          sessionId: 103,
          startTime: 1,
          duration: 300000,
          remaining: null,
          isPaused: false,
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

  it('creates a recovery round with unassigned today tasks when no next round exists', () => {
    const result = applyWorkPhaseRoundAdvance(
      buildState({
        rounds: [
          { id: 'r1', title: 'Round 1', scheduledTime: '09:00', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        ],
        tasks: [
          { id: 't1', title: 'Done', description: '', category: 'Work', estimateMinutes: 25, status: 'done', plannedDate: todayKey, roundId: 'r1' },
          { id: 't2', title: 'Unassigned', description: '', category: 'Work', estimateMinutes: 20, status: 'todo', plannedDate: todayKey },
        ],
      }),
    );

    expect(result).toBeDefined();
    expect(result?.nextRoundId).toBeDefined();
    expect(result?.rounds).toHaveLength(2);
    const recoveryRound = result?.rounds.find((round) => round.id === result?.nextRoundId);
    expect(recoveryRound?.status).toBe('active');
    expect(recoveryRound?.taskIds).toEqual(['t2']);
    expect(result?.tasks.find((task) => task.id === 't2')?.roundId).toBe(result?.nextRoundId);
  });

  it('does not create a round when no unassigned today tasks remain', () => {
    const result = applyWorkPhaseRoundAdvance(
      buildState({
        rounds: [
          { id: 'r1', title: 'Round 1', scheduledTime: '09:00', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        ],
        tasks: [
          { id: 't1', title: 'Done', description: '', category: 'Work', estimateMinutes: 25, status: 'done', plannedDate: todayKey, roundId: 'r1' },
        ],
      }),
    );

    expect(result?.rounds).toHaveLength(1);
    expect(result?.nextRoundId).toBeUndefined();
  });
});
