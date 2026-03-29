import { Task } from '../types';
import { hasDuplicateTodayTaskTitle } from './tasks';

const todayKey = '2026-03-29';

const buildTask = (overrides: Partial<Task>): Task => ({
  id: 'task-id',
  title: 'Default task',
  description: 'Description',
  category: 'Uncategorized',
  estimateMinutes: 25,
  status: 'todo',
  plannedDate: todayKey,
  ...overrides,
});

describe('task title validation', () => {
  it('matches duplicate names for today regardless of case and whitespace', () => {
    const tasks = [buildTask({ id: '1', title: '  Plan Sprint  ' })];

    expect(hasDuplicateTodayTaskTitle(tasks, todayKey, 'plan sprint')).toBe(true);
  });

  it('ignores tasks from other days', () => {
    const tasks = [buildTask({ id: '1', title: 'Plan sprint', plannedDate: '2026-03-28' })];

    expect(hasDuplicateTodayTaskTitle(tasks, todayKey, 'Plan sprint')).toBe(false);
  });

  it('ignores the currently edited task id', () => {
    const tasks = [buildTask({ id: '1', title: 'Plan sprint' })];

    expect(hasDuplicateTodayTaskTitle(tasks, todayKey, 'Plan sprint', '1')).toBe(false);
  });
});

