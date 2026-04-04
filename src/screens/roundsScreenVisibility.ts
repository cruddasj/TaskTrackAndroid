import { Task } from '../types';

export const getUnassignedTodoTasks = (todaysTasks: Task[], roundIds: Set<string>): Task[] =>
  todaysTasks
    .filter((task) => task.status !== 'done' && (!task.roundId || !roundIds.has(task.roundId)))
    .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }));

export const shouldShowCategoryGroupingSuggestion = (todaysTasks: Task[]): boolean =>
  todaysTasks.some((task) => task.status !== 'done' && !task.roundId);
