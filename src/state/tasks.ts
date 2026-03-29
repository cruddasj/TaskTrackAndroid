import { Task } from '../types';

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

