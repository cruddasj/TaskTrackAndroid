import { Task } from '../types';
import {
  areAllTasksCompletedForDate,
  filterTaskBankItems,
  getLastCompletedAtByTaskTitle,
  getTaskBankCategoriesWithAssignedTasks,
  hasDuplicateTodayTaskTitle,
  sortCategoriesAlphabetically,
  sortTaskBankItemsAlphabetically,
  sortTasksAlphabetically,
  suggestRecurringTaskBankItems,
  WEEKDAY_SELECTION_ORDER,
} from './tasks';

const todayKey = '2026-03-29';
const cooldownOff = { cooldownEnabled: false, cooldownDays: 3 };

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

describe('weekday selection order', () => {
  it('starts from Monday and ends with Sunday for Task Bank weekday selection', () => {
    expect(WEEKDAY_SELECTION_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});


describe('sortTaskBankItemsAlphabetically', () => {
  it('sorts task bank items by title regardless of case and whitespace', () => {
    const taskBank = [
      { id: '2', title: ' zebra cleanup', description: '', category: 'Home', estimateMinutes: 15 },
      { id: '3', title: 'Alpha plan', description: '', category: 'Work', estimateMinutes: 30 },
      { id: '1', title: 'beta review', description: '', category: 'Work', estimateMinutes: 25 },
      { id: '4', title: '  alpha plan', description: '', category: 'Work', estimateMinutes: 10 },
    ];

    const sorted = sortTaskBankItemsAlphabetically(taskBank);

    expect(sorted.map((item) => item.id)).toEqual(['3', '4', '1', '2']);
    expect(taskBank.map((item) => item.id)).toEqual(['2', '3', '1', '4']);
  });
});

describe('sortCategoriesAlphabetically', () => {
  it('sorts categories regardless of case and surrounding whitespace', () => {
    const categories = [' work', 'Errands', 'health', '  Personal projects'];

    const sorted = sortCategoriesAlphabetically(categories);

    expect(sorted).toEqual(['Errands', 'health', '  Personal projects', ' work']);
    expect(categories).toEqual([' work', 'Errands', 'health', '  Personal projects']);
  });
});

describe('filterTaskBankItems', () => {
  const taskBank = [
    { id: '1', title: 'Deep work block', description: 'No meetings', category: 'Work', estimateMinutes: 60 },
    { id: '2', title: 'Grocery restock', description: 'Buy fruit', category: 'Home', estimateMinutes: 30, recurrenceDays: 7 },
    { id: '3', title: 'Stretch break', description: '5 minute mobility', category: 'Health', estimateMinutes: 5, recurrenceWeekdays: [1, 3, 5] },
    { id: '4', title: 'Billing review', description: 'Check subscriptions', category: 'Home', estimateMinutes: 20, recurrenceDayOfMonth: 15 },
  ];

  it('filters by search query across title, description, and category', () => {
    expect(filterTaskBankItems(taskBank, { query: 'fruit', category: 'all', recurrence: 'all' }).map((item) => item.id)).toEqual(['2']);
    expect(filterTaskBankItems(taskBank, { query: 'health', category: 'all', recurrence: 'all' }).map((item) => item.id)).toEqual(['3']);
  });

  it('filters by category', () => {
    expect(filterTaskBankItems(taskBank, { query: '', category: 'Work', recurrence: 'all' }).map((item) => item.id)).toEqual(['1']);
  });

  it('filters by recurrence type', () => {
    expect(filterTaskBankItems(taskBank, { query: '', category: 'all', recurrence: 'one-off' }).map((item) => item.id)).toEqual(['1']);
    expect(filterTaskBankItems(taskBank, { query: '', category: 'all', recurrence: 'recurring' }).map((item) => item.id)).toEqual(['2', '3', '4']);
  });
});

describe('getTaskBankCategoriesWithAssignedTasks', () => {
  it('returns only categories currently assigned to task bank items in alphabetical order', () => {
    const taskBank = [
      { id: '1', title: 'Deep work block', description: 'No meetings', category: 'Work and study', estimateMinutes: 60 },
      { id: '2', title: 'Grocery restock', description: 'Buy fruit', category: 'Errands', estimateMinutes: 30 },
      { id: '3', title: 'Daily stretch', description: '10 minute routine', category: 'Health and wellbeing', estimateMinutes: 10 },
      { id: '4', title: 'Sprint planning', description: 'Team planning', category: 'Work and study', estimateMinutes: 45 },
    ];

    expect(getTaskBankCategoriesWithAssignedTasks(taskBank)).toEqual(['Errands', 'Health and wellbeing', 'Work and study']);
  });
});

describe('sortTasksAlphabetically', () => {
  it('sorts tasks by title regardless of case and surrounding whitespace', () => {
    const tasks = [
      buildTask({ id: '2', title: ' zebra cleanup' }),
      buildTask({ id: '3', title: 'Alpha plan' }),
      buildTask({ id: '1', title: 'beta review' }),
      buildTask({ id: '4', title: '  alpha plan' }),
    ];

    const sorted = sortTasksAlphabetically(tasks);

    expect(sorted.map((task) => task.id)).toEqual(['3', '4', '1', '2']);
    expect(tasks.map((task) => task.id)).toEqual(['2', '3', '1', '4']);
  });
});

describe('suggestRecurringTaskBankItems', () => {
  it('suggests recurring tasks that have never been completed and are not already in today list', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], todayKey, cooldownOff, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest recurring tasks completed within recurrence window', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'make bread', status: 'done', plannedDate: '2026-03-27', completedAt: '2026-03-27T09:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, todayKey, cooldownOff, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('does not suggest recurring tasks when manually completed outside the app within recurrence window', () => {
    const taskBank = [
      {
        id: 'tb1',
        title: 'Make bread',
        description: 'Bake sourdough',
        category: 'Household chores',
        estimateMinutes: 25,
        recurrenceDays: 7,
        lastCompletedOn: '2026-03-27',
      },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], todayKey, cooldownOff, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('suggests recurring tasks once recurrence threshold is reached', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'Make bread', status: 'done', plannedDate: '2026-03-22', completedAt: '2026-03-22T08:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, todayKey, cooldownOff, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest items already scheduled today', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 7 },
    ];
    const tasks = [buildTask({ id: 'todo-1', title: 'Make bread' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, todayKey, cooldownOff, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('does not suggest items for tomorrow when already planned today', () => {
    const taskBank = [
      { id: 'tb1', title: 'Make bread', description: 'Bake sourdough', category: 'Household chores', estimateMinutes: 25, recurrenceDays: 1 },
    ];
    const tasks = [buildTask({ id: 'todo-1', title: 'Make bread', plannedDate: '2026-03-29' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, '2026-03-30', cooldownOff, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('suggests weekday-recurring items when today matches the configured weekday', () => {
    const taskBank = [
      { id: 'tb1', title: 'Sunday reset', description: 'Plan next week', category: 'Personal projects', estimateMinutes: 30, recurrenceWeekdays: [0] },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], todayKey, cooldownOff, new Date('2026-03-29T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest weekday-recurring items when completed in the current recurrence period', () => {
    const taskBank = [
      { id: 'tb1', title: 'Washing up', description: 'Kitchen cleanup', category: 'Household chores', estimateMinutes: 20, recurrenceWeekdays: [6] },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'washing up', status: 'done', plannedDate: '2026-04-03', completedAt: '2026-04-03T18:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, '2026-04-04', cooldownOff, new Date('2026-04-04T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('suggests overdue weekday-recurring items when they have not appeared in the last seven days', () => {
    const taskBank = [
      { id: 'tb1', title: 'Sunday reset', description: 'Plan next week', category: 'Personal projects', estimateMinutes: 30, recurrenceWeekdays: [0] },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], '2026-03-30', cooldownOff, new Date('2026-03-30T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest overdue weekday-recurring items when they already appeared in the last seven days', () => {
    const taskBank = [
      { id: 'tb1', title: 'Sunday reset', description: 'Plan next week', category: 'Personal projects', estimateMinutes: 30, recurrenceWeekdays: [0] },
    ];
    const tasks = [buildTask({ id: 'todo-1', title: 'Sunday reset', plannedDate: '2026-03-29' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, '2026-03-30', cooldownOff, new Date('2026-03-30T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('suggests month-day recurring items when today matches the configured day', () => {
    const taskBank = [
      { id: 'tb1', title: 'Pay rent', description: 'Transfer payment', category: 'Errands', estimateMinutes: 5, recurrenceDayOfMonth: 1 },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], '2026-04-01', cooldownOff, new Date('2026-04-01T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });

  it('does not suggest month-day recurring items when completed in the current recurrence period', () => {
    const taskBank = [
      { id: 'tb1', title: 'Pay rent', description: 'Transfer payment', category: 'Errands', estimateMinutes: 5, recurrenceDayOfMonth: 1 },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'Pay rent', status: 'done', plannedDate: '2026-03-31', completedAt: '2026-03-31T09:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(taskBank, tasks, '2026-04-01', cooldownOff, new Date('2026-04-01T12:00:00.000Z'));

    expect(suggestions).toEqual([]);
  });

  it('suggests month-day recurring items on last day for shorter months', () => {
    const taskBank = [
      { id: 'tb1', title: 'Month-end backup', description: 'Archive files', category: 'Work', estimateMinutes: 15, recurrenceDayOfMonth: 31 },
    ];

    const suggestions = suggestRecurringTaskBankItems(taskBank, [], '2026-04-30', cooldownOff, new Date('2026-04-30T12:00:00.000Z'));

    expect(suggestions.map((item) => item.id)).toEqual(['tb1']);
  });


  it('hides weekly suggestions completed within configured cool down days when enabled', () => {
    const taskBank = [
      { id: 'tb1', title: 'Sunday reset', description: 'Plan next week', category: 'Personal projects', estimateMinutes: 30, recurrenceWeekdays: [0] },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'Sunday reset', status: 'done', plannedDate: '2026-03-27', completedAt: '2026-03-27T10:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(
      taskBank,
      tasks,
      todayKey,
      { cooldownEnabled: true, cooldownDays: 3 },
      new Date('2026-03-29T12:00:00.000Z'),
    );

    expect(suggestions).toEqual([]);
  });

  it('hides day-of-month suggestions completed within configured cool down days when enabled', () => {
    const taskBank = [
      { id: 'tb1', title: 'Pay rent', description: 'Transfer payment', category: 'Errands', estimateMinutes: 5, recurrenceDayOfMonth: 1 },
    ];
    const tasks = [buildTask({ id: 'done-1', title: 'Pay rent', status: 'done', plannedDate: '2026-03-31', completedAt: '2026-03-31T09:00:00.000Z' })];

    const suggestions = suggestRecurringTaskBankItems(
      taskBank,
      tasks,
      '2026-04-01',
      { cooldownEnabled: true, cooldownDays: 2 },
      new Date('2026-04-01T12:00:00.000Z'),
    );

    expect(suggestions).toEqual([]);
  });
});

describe('getLastCompletedAtByTaskTitle', () => {
  it('returns the most recent completion timestamp for each normalized title', () => {
    const tasks = [
      buildTask({ id: 'done-1', title: '  Pay rent ', status: 'done', completedAt: '2026-04-01T08:00:00.000Z' }),
      buildTask({ id: 'done-2', title: 'pay rent', status: 'done', completedAt: '2026-04-03T09:15:00.000Z' }),
      buildTask({ id: 'done-3', title: 'Walk dog', status: 'done', plannedDate: '2026-04-02' }),
      buildTask({ id: 'todo-1', title: 'Walk dog', status: 'todo', plannedDate: '2026-04-04' }),
    ];

    const completions = getLastCompletedAtByTaskTitle(tasks);

    expect(completions.get('pay rent')).toBe(new Date('2026-04-03T09:15:00.000Z').getTime());
    expect(completions.get('walk dog')).toBe(new Date('2026-04-02T00:00:00.000Z').getTime());
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
