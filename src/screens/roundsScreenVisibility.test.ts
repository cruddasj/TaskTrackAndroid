import { getRoundDisplaySections, getUnassignedTodoTasks, shouldShowCategoryGroupingSuggestion } from './roundsScreenVisibility';
import { Round, Task } from '../types';

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Task',
  description: '',
  category: 'General',
  estimateMinutes: 25,
  status: 'todo',
  plannedDate: '2026-03-31',
  ...overrides,
});

const buildRound = (overrides: Partial<Round> = {}): Round => ({
  id: 'round-1',
  title: 'Round 1',
  scheduledTime: '',
  durationMinutes: 25,
  taskIds: [],
  status: 'upcoming',
  ...overrides,
});

describe('shouldShowCategoryGroupingSuggestion', () => {
  it('returns true when there is at least one unfinished unassigned task', () => {
    expect(shouldShowCategoryGroupingSuggestion([
      buildTask({ status: 'done' }),
      buildTask({ id: 'task-2', status: 'todo' }),
    ])).toBe(true);
  });

  it('returns false when all unfinished tasks are already assigned to rounds', () => {
    expect(shouldShowCategoryGroupingSuggestion([
      buildTask({ status: 'done' }),
      buildTask({ id: 'task-2', status: 'todo', roundId: 'round-1' }),
    ])).toBe(false);
  });

  it('returns false when all today tasks are finished', () => {
    expect(shouldShowCategoryGroupingSuggestion([
      buildTask({ status: 'done' }),
      buildTask({ id: 'task-2', status: 'done' }),
    ])).toBe(false);
  });

  it('returns false when there are no today tasks', () => {
    expect(shouldShowCategoryGroupingSuggestion([])).toBe(false);
  });
});

describe('getUnassignedTodoTasks', () => {
  it('returns only unfinished tasks that are unassigned', () => {
    const tasks = [
      buildTask({ id: 'task-1', status: 'todo', title: 'Bravo' }),
      buildTask({ id: 'task-2', status: 'in_progress', title: 'alpha' }),
      buildTask({ id: 'task-3', status: 'done', title: 'Charlie' }),
      buildTask({ id: 'task-4', status: 'todo', title: 'Delta', roundId: 'round-1' }),
      buildTask({ id: 'task-5', status: 'todo', title: 'charlie', roundId: 'missing-round' }),
    ];

    expect(getUnassignedTodoTasks(tasks, new Set(['round-1']))).toEqual([
      expect.objectContaining({ id: 'task-2' }),
      expect.objectContaining({ id: 'task-1' }),
      expect.objectContaining({ id: 'task-5' }),
    ]);
  });
});

describe('getRoundDisplaySections', () => {
  it('splits rounds into planned and completed sections while retaining original order', () => {
    const rounds = [
      buildRound({ id: 'round-1', title: 'Round 1', status: 'active' }),
      buildRound({ id: 'round-2', title: 'Round 2', status: 'done' }),
      buildRound({ id: 'round-3', title: 'Round 3', status: 'upcoming' }),
      buildRound({ id: 'round-4', title: 'Round 4', status: 'done' }),
    ];

    expect(getRoundDisplaySections(rounds)).toEqual({
      plannedRounds: [
        expect.objectContaining({ id: 'round-1' }),
        expect.objectContaining({ id: 'round-3' }),
      ],
      completedRounds: [
        expect.objectContaining({ id: 'round-2' }),
        expect.objectContaining({ id: 'round-4' }),
      ],
    });
  });
});
