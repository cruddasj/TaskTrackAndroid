import { AppState } from '../types';
import { shouldPlayInAppCompletionAlarm } from './alarmPlayback';
import { getCarryHistoryForRound } from './rounds';
import { getAssignmentRoundUpdate, getRevivedTaskRoundUpdate } from './taskRoundHistory';

const buildState = (overrides: Partial<AppState> = {}): AppState => ({
  userName: 'Test User',
  categories: ['Work'],
  tasks: [],
  taskBank: [],
  rounds: [],
  settings: {
    pomodoroMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    debugModeEnabled: false,
    debugPomodoroSeconds: 1500,
    debugShortBreakSeconds: 300,
    debugLongBreakSeconds: 900,
    sessionsBeforeLongBreak: 4,
    sessionReviewGraceSeconds: 60,
    alarmTone: 'clock_bell',
    alarmVolume: 70,
    showFirstTimeGuidance: true,
    hasSeenWelcomeModal: false,
  },
  pomodoro: {
    sessionId: null,
    startTime: null,
    duration: 1_500_000,
    remaining: null,
    isPaused: false,
    isRunning: false,
    startedAt: null,
    remainingSeconds: 1500,
    totalSeconds: 1500,
    phase: 'work',
    completedWorkSessions: 0,
    activeTaskId: undefined,
    activeRoundId: undefined,
  },
  ...overrides,
});

describe('AppStateContext reducer round history behavior', () => {
  it('plays in-app completion alarms on web and only while active on native', () => {
    expect(shouldPlayInAppCompletionAlarm(false, true)).toBe(true);
    expect(shouldPlayInAppCompletionAlarm(false, false)).toBe(true);
    expect(shouldPlayInAppCompletionAlarm(true, true)).toBe(true);
    expect(shouldPlayInAppCompletionAlarm(true, false)).toBe(false);
  });

  it('unassigns revived tasks from done rounds', () => {
    const initialState = buildState({
      rounds: [{ id: 'round-done', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['task-1'], status: 'done' }],
      tasks: [{
        id: 'task-1',
        title: 'Write summary',
        description: '',
        category: 'Work',
        estimateMinutes: 25,
        status: 'done',
        plannedDate: '2026-04-03',
        completedAt: '2026-04-03T08:00:00.000Z',
        roundId: 'round-done',
      }],
    });

    const revivedTask = {
      ...initialState.tasks[0],
      status: 'todo' as const,
      completedAt: undefined,
      ...getRevivedTaskRoundUpdate(initialState.tasks[0], initialState.rounds),
    };

    expect(revivedTask.status).toBe('todo');
    expect(revivedTask.completedAt).toBeUndefined();
    expect(revivedTask.roundId).toBeUndefined();
  });

  it('stores the original done round id once in previousRoundIds when reviving', () => {
    const initialState = buildState({
      rounds: [{ id: 'round-done', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['task-1'], status: 'done' }],
      tasks: [{
        id: 'task-1',
        title: 'Write summary',
        description: '',
        category: 'Work',
        estimateMinutes: 25,
        status: 'done',
        plannedDate: '2026-04-03',
        completedAt: '2026-04-03T08:00:00.000Z',
        roundId: 'round-done',
        previousRoundIds: ['round-done'],
      }],
    });

    const revivedTask = getRevivedTaskRoundUpdate(initialState.tasks[0], initialState.rounds);

    expect(revivedTask.previousRoundIds).toEqual(['round-done']);
  });

  it('keeps carry history intact after reassignment and avoids duplicate history entries', () => {
    const initialState = buildState({
      rounds: [
        { id: 'round-done', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['task-1'], status: 'done' },
        { id: 'round-new', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'active' },
      ],
      tasks: [{
        id: 'task-1',
        title: 'Write summary',
        description: '',
        category: 'Work',
        estimateMinutes: 25,
        status: 'done',
        plannedDate: '2026-04-03',
        completedAt: '2026-04-03T08:00:00.000Z',
        roundId: 'round-done',
      }],
    });

    const revivedTask = {
      ...initialState.tasks[0],
      status: 'todo' as const,
      completedAt: undefined,
      ...getRevivedTaskRoundUpdate(initialState.tasks[0], initialState.rounds),
    };
    const reassignedTask = {
      ...revivedTask,
      ...getAssignmentRoundUpdate(revivedTask, 'round-new', true),
    };
    const carryHistory = getCarryHistoryForRound(reassignedTask, 'round-done');

    expect(reassignedTask.previousRoundIds).toEqual(['round-done']);
    expect(carryHistory).toEqual({
      carriedFromRoundId: undefined,
      carriedToRoundId: 'round-new',
    });
  });
});
