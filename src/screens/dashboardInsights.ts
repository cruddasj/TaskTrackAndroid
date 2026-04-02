import type { Task } from '../types';

export interface CompletedTaskDay {
  dayKey: string;
  tasks: Task[];
}

const getRecentDayKeys = (historyWindowDays: number) => Array.from(new Array(historyWindowDays), (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - index);
  return date.toISOString().slice(0, 10);
});

const getTaskCompletionDay = (task: Task): string | null => {
  if (task.completedAt) {
    return task.completedAt.slice(0, 10);
  }

  return task.status === 'done' ? task.plannedDate : null;
};

export const getCategoryTotals = (tasks: Task[], historyWindowDays: number): Record<string, number> => {
  const recentDayKeys = new Set(getRecentDayKeys(historyWindowDays));

  return tasks.reduce<Record<string, number>>((acc, task) => {
    const completionDay = getTaskCompletionDay(task);
    if (!completionDay || !recentDayKeys.has(completionDay)) {
      return acc;
    }

    acc[task.category] = (acc[task.category] ?? 0) + task.estimateMinutes;
    return acc;
  }, {});
};

export const getCompletedTaskHistory = (tasks: Task[], historyWindowDays: number): CompletedTaskDay[] => {
  const recentDayKeys = getRecentDayKeys(historyWindowDays);

  return recentDayKeys
    .map((dayKey) => {
      const completedTasks = tasks.filter((task) => getTaskCompletionDay(task) === dayKey);
      return { dayKey, tasks: completedTasks };
    })
    .filter((entry) => entry.tasks.length > 0);
};

export const formatHistoryDayLabel = (dayKey: string): string => {
  const date = new Date(`${dayKey}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
