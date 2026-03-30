import { Task } from '../types';
import { areAllTasksCompletedForDate, hasDuplicateTodayTaskTitle, suggestRecurringTaskBankItems } from './tasks';

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

describe('suggestRecurringTaskBankItems', () => {
  it('suggests recurring tasks that have never been completed and are not already in today list', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], todayKey, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest recurring tasks completed within recurrence window', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'make bread', status: 'done', plannedDate: '2026-03-27', completedAt: '2026-03-27T09:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, todayKey, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('suggests recurring tasks once recurrence threshold is reached', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'Make bread', status: 'done', plannedDate: '2026-03-22', completedAt: '2026-03-22T08:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, todayKey, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest items already scheduled today', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];
    const tasks = [buildTask({ id: 'todo-1', title: 'Make bread' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, todayKey, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('suggests weekday-recurring items when today matches the configured weekday', () => {
    const taskBank = [
      { id: 'tb1', title: 'Sunday reset', description: 'Plan next week', category: 'Personal projects', estimateMinutes: 30, recurrenceWeekdays: [0] },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], todayKey, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('suggests overdue weekday-recurring items when they have not appeared in the last seven days', () => {
    const taskBank = [
      { id: 'tb1', title: 'Sunday reset', description: 'Plan next week', category: 'Personal projects', estimateMinutes: 30, recurrenceWeekdays: [0] },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], '2026-03-30', new Date('2026-03-30T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest overdue weekday-recurring items when they already appeared in the last seven days', () => {
    const taskBank = [
      { id: 'tb1', title: 'Sunday reset', description: 'Plan next week', category: 'Personal projects', estimateMinutes: 30, recurrenceWeekdays: [0] },
    ];
    const tasks = [buildTask({ id: 'todo-1', title: 'Sunday reset', plannedDate: '2026-03-29' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, '2026-03-30', new Date('2026-03-30T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });
});

describe('areAllTasksCompletedForDate', () => {
  it('returns true when every task for a date is complete', () => {
    const tasks = [
      buildTask({ id: 'done-1', status: 'done' }),
      buildTask({ id: 'done-2', status: 'done' }),
      buildTask({ id: 'other-day', plannedDate: '2026-03-28', status: 'todo' }),
    ];

    expect(areAllTasksCompletedForDate(tasks, todayKey)).toBe(true);
  });

  it('returns false when there are no tasks for the date', () => {
    const tasks = [buildTask({ id: 'other-day', plannedDate: '2026-03-28', status: 'done' })];

    expect(areAllTasksCompletedForDate(tasks, todayKey)).toBe(false);
  });

  it('returns false when at least one task for the date is not complete', () => {
    const tasks = [
      buildTask({ id: 'done-1', status: 'done' }),
      buildTask({ id: 'todo-1', status: 'todo' }),
    ];

    expect(areAllTasksCompletedForDate(tasks, todayKey)).toBe(false);
  });
});
