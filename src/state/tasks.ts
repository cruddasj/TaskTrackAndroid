import { Task, TaskBankItem } from '../types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeTaskTitle = (title: string): string => title.trim().toLocaleLowerCase();
const parseDayKeyToUtcMs = (dayKey: string): number => new Date(`${dayKey}T00:00:00.000Z`).getTime();
const formatLocalDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

const getTaskCompletionTime = (task: Task): number | null => {
  if (task.completedAt) {
    const completedAtMs = new Date(task.completedAt).getTime();
    if (Number.isFinite(completedAtMs)) {
      return completedAtMs;
    }
  }

  if (task.status === 'done') {
    const plannedDateMs = parseDayKeyToUtcMs(task.plannedDate);
    if (Number.isFinite(plannedDateMs)) {
      return plannedDateMs;
    }
  }

  return null;
};

export const getLastCompletedAtByTaskTitle = (tasks: Task[]): Map<string, number> => {
  const completionByTitle = new Map<string, number>();
  tasks.forEach((task) => {
    const completedMs = getTaskCompletionTime(task);
    if (completedMs === null) return;
    const titleKey = normalizeTaskTitle(task.title);
    if (!titleKey) return;

    const existing = completionByTitle.get(titleKey);
    if (existing === undefined || completedMs > existing) {
      completionByTitle.set(titleKey, completedMs);
    }
  });
  return completionByTitle;
};


const defaultCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export const sortTaskBankItemsAlphabetically = (taskBank: TaskBankItem[]): TaskBankItem[] => {
  return [...taskBank].sort((a, b) => {
    const titleComparison = defaultCollator.compare(a.title.trim(), b.title.trim());
    if (titleComparison !== 0) return titleComparison;
    return defaultCollator.compare(a.id, b.id);
  });
};

export const getTaskBankCategoriesWithAssignedTasks = (taskBank: TaskBankItem[]): string[] => {
  const assignedCategories = [...new Set(taskBank.map((item) => item.category))];
  return sortCategoriesAlphabetically(assignedCategories);
};

interface TaskBankFilterOptions {
  query: string;
  category: string;
  recurrence: 'all' | 'one-off' | 'recurring';
  recurrencePattern: 'all' | 'every-x-days' | 'day-of-week' | 'day-of-month';
}

export const filterTaskBankItems = (
  taskBank: TaskBankItem[],
  { query, category, recurrence, recurrencePattern }: TaskBankFilterOptions,
): TaskBankItem[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return taskBank.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;

    const isEveryXDaysRecurring = Boolean(item.recurrenceDays && item.recurrenceDays > 0);
    const isWeekdayRecurring = Boolean(item.recurrenceWeekdays && item.recurrenceWeekdays.length > 0);
    const isMonthDayRecurring = Boolean(item.recurrenceDayOfMonth && item.recurrenceDayOfMonth >= 1 && item.recurrenceDayOfMonth <= 31);
    const hasRecurrence = isEveryXDaysRecurring || isWeekdayRecurring || isMonthDayRecurring;
    if (recurrence === 'one-off' && hasRecurrence) return false;
    if (recurrence === 'recurring' && !hasRecurrence) return false;
    if (recurrencePattern === 'every-x-days' && !isEveryXDaysRecurring) return false;
    if (recurrencePattern === 'day-of-week' && !isWeekdayRecurring) return false;
    if (recurrencePattern === 'day-of-month' && !isMonthDayRecurring) return false;

    if (!normalizedQuery) return true;
    return [item.title, item.description, item.category].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery));
  });
};

export const sortCategoriesAlphabetically = (categories: string[]): string[] => {
  return [...categories].sort((a, b) => defaultCollator.compare(a.trim(), b.trim()));
};

export const sortTasksAlphabetically = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const titleComparison = defaultCollator.compare(a.title.trim(), b.title.trim());
    if (titleComparison !== 0) return titleComparison;
    return defaultCollator.compare(a.id, b.id);
  });
};

export const suggestRecurringTaskBankItems = (
  taskBank: TaskBankItem[],
  tasks: Task[],
  plannedDate: string,
  options: { cooldownEnabled: boolean; cooldownDays: number },
  now: Date = new Date(),
): TaskBankItem[] => {
  const nowMs = now.getTime();
  const todayStartMs = parseDayKeyToUtcMs(plannedDate);
  const plannedDateUtc = new Date(todayStartMs);
  const todayWeekday = plannedDateUtc.getUTCDay();
  const todayDayOfMonth = plannedDateUtc.getUTCDate();
  const daysInCurrentMonth = new Date(Date.UTC(plannedDateUtc.getUTCFullYear(), plannedDateUtc.getUTCMonth() + 1, 0)).getUTCDate();
  const completionByTitle = getLastCompletionTimeByTitle(tasks);
  const normalizedCooldownDays = Math.max(1, Math.round(options.cooldownDays));
  const cooldownWindowMs = normalizedCooldownDays * DAY_IN_MS;
  const planningTomorrow = todayStartMs - parseDayKeyToUtcMs(formatLocalDayKey(now)) === DAY_IN_MS;
  const previousDayKey = new Date(todayStartMs - DAY_IN_MS).toISOString().slice(0, 10);

  const plannedDateTasksTitles = new Set<string>();
  const previousDayTaskTitles = new Set<string>();
  const recentAppearanceByTitle = new Map<string, number>();

  tasks.forEach((task) => {
    const titleKey = normalizeTaskTitle(task.title);
    if (!titleKey) return;
    if (task.plannedDate === plannedDate) {
      plannedDateTasksTitles.add(titleKey);
    }
    if (planningTomorrow && task.plannedDate === previousDayKey) {
      previousDayTaskTitles.add(titleKey);
    }
    const plannedMs = parseDayKeyToUtcMs(task.plannedDate);
    if (!Number.isFinite(plannedMs)) return;
    const existing = recentAppearanceByTitle.get(titleKey);
    if (existing === undefined || plannedMs > existing) {
      recentAppearanceByTitle.set(titleKey, plannedMs);
    }
  });

  const hasScheduledWeekdayInPastWeek = (unique: Set<number>): boolean => {
    for (let daysAgo = 1; daysAgo <= 7; daysAgo += 1) {
      const weekday = (todayWeekday - daysAgo + 7) % 7;
      if (unique.has(weekday)) return true;
    }
    return false;
  };

  const getMostRecentWeekdayOccurrenceMs = (uniqueWeekdays: Set<number>, includeToday: boolean): number | null => {
    for (let daysAgo = includeToday ? 0 : 1; daysAgo <= 7; daysAgo += 1) {
      const weekday = (todayWeekday - daysAgo + 7) % 7;
      if (uniqueWeekdays.has(weekday)) return todayStartMs - daysAgo * DAY_IN_MS;
    }
    return null;
  };

  return taskBank.filter((item) => {
    const titleKey = normalizeTaskTitle(item.title);
    if (plannedDateTasksTitles.has(titleKey)) return false;
    if (planningTomorrow && previousDayTaskTitles.has(titleKey)) return false;

    const trackedLastCompletedMs = completionByTitle.get(titleKey);
    const manualLastCompletedMs = item.lastCompletedOn ? parseDayKeyToUtcMs(item.lastCompletedOn) : undefined;
    const lastCompletedMs = Math.max(trackedLastCompletedMs ?? Number.NEGATIVE_INFINITY, manualLastCompletedMs ?? Number.NEGATIVE_INFINITY);

    const isWeeklyOrMonthlyRecurring = Boolean(
      (item.recurrenceWeekdays && item.recurrenceWeekdays.length > 0)
      || (item.recurrenceDayOfMonth && item.recurrenceDayOfMonth >= 1 && item.recurrenceDayOfMonth <= 31),
    );
    const shouldApplyCooldown = options.cooldownEnabled && isWeeklyOrMonthlyRecurring;
    const enforceRecurrencePeriodCompletionGate = !options.cooldownEnabled;

    if (shouldApplyCooldown && Number.isFinite(lastCompletedMs) && nowMs - lastCompletedMs < cooldownWindowMs) {
      return false;
    }

    if (item.recurrenceWeekdays && item.recurrenceWeekdays.length > 0) {
      const uniqueRecurrenceWeekdays = new Set(item.recurrenceWeekdays.filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6));
      if (uniqueRecurrenceWeekdays.size > 0) {
        const previousOccurrenceMs = getMostRecentWeekdayOccurrenceMs(uniqueRecurrenceWeekdays, false);
        const completedWithinCurrentWeekdayPeriod = Number.isFinite(lastCompletedMs)
          && previousOccurrenceMs !== null
          && lastCompletedMs > previousOccurrenceMs;
        if (uniqueRecurrenceWeekdays.has(todayWeekday)) {
          return !(enforceRecurrencePeriodCompletionGate && completedWithinCurrentWeekdayPeriod);
        }

        if (!hasScheduledWeekdayInPastWeek(uniqueRecurrenceWeekdays)) return false;
        const lastAppearanceMs = recentAppearanceByTitle.get(titleKey);
        if (!(lastAppearanceMs === undefined || nowMs - lastAppearanceMs >= 7 * DAY_IN_MS)) return false;
        return !(enforceRecurrencePeriodCompletionGate && completedWithinCurrentWeekdayPeriod);
      }
    }

    const recurrenceDayOfMonth = item.recurrenceDayOfMonth;
    if (recurrenceDayOfMonth && recurrenceDayOfMonth >= 1 && recurrenceDayOfMonth <= 31) {
      const isDueToday = todayDayOfMonth === Math.min(recurrenceDayOfMonth, daysInCurrentMonth);
      if (!isDueToday) return false;

      const previousMonthDate = new Date(Date.UTC(plannedDateUtc.getUTCFullYear(), plannedDateUtc.getUTCMonth() - 1, 1));
      const daysInPreviousMonth = new Date(Date.UTC(previousMonthDate.getUTCFullYear(), previousMonthDate.getUTCMonth() + 1, 0)).getUTCDate();
      const previousOccurrenceMs = Date.UTC(
        previousMonthDate.getUTCFullYear(),
        previousMonthDate.getUTCMonth(),
        Math.min(recurrenceDayOfMonth, daysInPreviousMonth),
      );
      if (!Number.isFinite(lastCompletedMs)) return true;
      return lastCompletedMs < previousOccurrenceMs;
    }

    const recurrenceDays = item.recurrenceDays;
    if (!recurrenceDays || recurrenceDays <= 0) return false;
    if (!Number.isFinite(lastCompletedMs)) return true;
    return nowMs - lastCompletedMs >= recurrenceDays * DAY_IN_MS;
  });
};
