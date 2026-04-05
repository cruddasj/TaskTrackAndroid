import { Task } from '../types';
import { getTasksAfterRoundDeletion } from './roundDeletion';

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Task',
  description: '',
  category: 'Work',
  estimateMinutes: 25,
  status: 'todo',
  plannedDate: '2026-04-05',
  ...overrides,
});

describe('getTasksAfterRoundDeletion', () => {
  it('unassigns tasks from a deleted round without changing completion status by default', () => {
    const tasks = [
      buildTask({ id: 'task-done', status: 'done', completedAt: '2026-04-05T10:00:00.000Z', roundId: 'round-1' }),
      buildTask({ id: 'task-other', roundId: 'round-2' }),
    ];

    const updated = getTasksAfterRoundDeletion(tasks, 'round-1', false);

    expect(updated[0].roundId).toBeUndefined();
    expect(updated[0].status).toBe('done');
    expect(updated[0].completedAt).toBe('2026-04-05T10:00:00.000Z');
    expect(updated[1]).toEqual(tasks[1]);
  });

  it('marks tasks as todo again when reviving tasks from a deleted completed round', () => {
    const tasks = [
      buildTask({ id: 'task-done', status: 'done', completedAt: '2026-04-05T10:00:00.000Z', roundId: 'round-1' }),
      buildTask({ id: 'task-progress', status: 'in_progress', roundId: 'round-1' }),
    ];

    const updated = getTasksAfterRoundDeletion(tasks, 'round-1', true);

    expect(updated[0].roundId).toBeUndefined();
    expect(updated[0].status).toBe('todo');
    expect(updated[0].completedAt).toBeUndefined();
    expect(updated[1].status).toBe('todo');
  });
});
