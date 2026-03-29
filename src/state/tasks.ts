import { Task, TaskBankItem } from '../types';

const normalizeTaskTitle = (title: string): string => title.trim().toLocaleLowerCase();

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

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

export const suggestRecurringTaskBankItems = (
  taskBank: TaskBankItem[],
  tasks: Task[],
  plannedDate: string,
  now: Date = new Date(),
): TaskBankItem[] => {
  const nowMs = now.getTime();
  const completionByTitle = getLastCompletionTimeByTitle(tasks);

  return taskBank.filter((item) => {
    const recurrenceDays = item.recurrenceDays;
    if (!recurrenceDays || recurrenceDays <= 0) return false;
    if (hasDuplicateTodayTaskTitle(tasks, plannedDate, item.title)) return false;

    const titleKey = normalizeTaskTitle(item.title);
    const lastCompletedMs = completionByTitle.get(titleKey);
    if (lastCompletedMs === undefined) return true;
    return nowMs - lastCompletedMs >= recurrenceDays * DAY_IN_MS;
  });
};
