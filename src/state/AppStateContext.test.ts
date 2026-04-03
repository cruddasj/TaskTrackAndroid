import { AppState } from '../types';
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
    sessionsBeforeLongBreak: 4,
    sessionReviewGraceSeconds: 60,
    alarmTone: 'bell',
    alarmVolume: 70,
    alarmRepeatCount: 3,
    showFirstTimeGuidance: true,
  },
  pomodoro: {
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
