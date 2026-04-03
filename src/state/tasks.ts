import { Task, TaskBankItem } from '../types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeTaskTitle = (title: string): string => title.trim().toLocaleLowerCase();
const parseDayKeyToUtcMs = (dayKey: string): number => new Date(`${dayKey}T00:00:00.000Z`).getTime();

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const WEEKDAY_SELECTION_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const areAllTasksCompletedForDate = (tasks: Task[], plannedDate: string): boolean => {
  const tasksForDate = tasks.filter((task) => task.plannedDate === plannedDate);
  return tasksForDate.length > 0 && tasksForDate.every((task) => task.status === 'done');
};

export const hasDuplicateTodayTaskTitle = (
  tasks: Task[],
  plannedDate: string,
  title: string,
  excludeTaskId?: string,
): boolean => {
  const normalizedTitle = normalizeTaskTitle(title);
  if (!normalizedTitle) return false;

  return tasks.some(
    (task) =>
      task.plannedDate === plannedDate
      && task.id !== excludeTaskId
      && normalizeTaskTitle(task.title) === normalizedTitle,
  );
};

const getLastCompletionTimeByTitle = (tasks: Task[]): Map<string, number> => {
  const completionByTitle = new Map<string, number>();
  tasks.forEach((task) => {
    if (!task.completedAt) return;
    const completedAtMs = new Date(task.completedAt).getTime();
    if (!Number.isFinite(completedAtMs)) return;
    const titleKey = normalizeTaskTitle(task.title);
    if (!titleKey) return;
    const existing = completionByTitle.get(titleKey);
    if (existing === undefined || completedAtMs > existing) {
      completionByTitle.set(titleKey, completedAtMs);
    }
  });
  return completionByTitle;
};


export const sortTaskBankItemsAlphabetically = (taskBank: TaskBankItem[]): TaskBankItem[] => {
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  return [...taskBank].sort((a, b) => {
    const titleComparison = collator.compare(a.title.trim(), b.title.trim());
    if (titleComparison !== 0) return titleComparison;
    return collator.compare(a.id, b.id);
  });
};

export const suggestRecurringTaskBankItems = (
  taskBank: TaskBankItem[],
  tasks: Task[],
  plannedDate: string,
  now: Date = new Date(),
): TaskBankItem[] => {
  const nowMs = now.getTime();
  const plannedDateWeekday = new Date(`${plannedDate}T00:00:00.000Z`).getUTCDay();
  const completionByTitle = getLastCompletionTimeByTitle(tasks);
  const recentAppearanceByTitle = new Map<string, number>();
  tasks.forEach((task) => {
    const titleKey = normalizeTaskTitle(task.title);
    if (!titleKey) return;
    const plannedMs = parseDayKeyToUtcMs(task.plannedDate);
    if (!Number.isFinite(plannedMs)) return;
    const existing = recentAppearanceByTitle.get(titleKey);
    if (existing === undefined || plannedMs > existing) {
      recentAppearanceByTitle.set(titleKey, plannedMs);
    }
  });

  const hasScheduledWeekdayInPastWeek = (recurrenceWeekdays: number[]): boolean => {
      const unique = new Set(recurrenceWeekdays);
      for (let daysAgo = 1; daysAgo <= 7; daysAgo += 1) {
      const weekday = (plannedDateWeekday - daysAgo + 7) % 7;
        if (unique.has(weekday)) return true;
      }
      return false;
  };

  return taskBank.filter((item) => {
    if (hasDuplicateTodayTaskTitle(tasks, plannedDate, item.title)) return false;

    const titleKey = normalizeTaskTitle(item.title);
    const recurrenceWeekdays = (item.recurrenceWeekdays ?? []).filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6);
    if (recurrenceWeekdays.length > 0) {
      if (recurrenceWeekdays.includes(plannedDateWeekday)) return true;

      if (!hasScheduledWeekdayInPastWeek(recurrenceWeekdays)) return false;
      const lastAppearanceMs = recentAppearanceByTitle.get(titleKey);
      return lastAppearanceMs === undefined || nowMs - lastAppearanceMs >= 7 * DAY_IN_MS;
    }

    const recurrenceDays = item.recurrenceDays;
    if (!recurrenceDays || recurrenceDays <= 0) return false;
    const lastCompletedMs = completionByTitle.get(titleKey);
    if (lastCompletedMs === undefined) return true;
    return nowMs - lastCompletedMs >= recurrenceDays * DAY_IN_MS;
  });
};
