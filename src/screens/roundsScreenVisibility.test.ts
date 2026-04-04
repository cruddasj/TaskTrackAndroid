import { getUnassignedTodoTasks, shouldShowCategoryGroupingSuggestion } from './roundsScreenVisibility';
import { Task } from '../types';

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
