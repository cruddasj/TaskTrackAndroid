import { shouldShowCategoryGroupingSuggestion } from './roundsScreenVisibility';
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
