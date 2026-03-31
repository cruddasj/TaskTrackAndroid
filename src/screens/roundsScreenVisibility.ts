import { Task } from '../types';

export const shouldShowCategoryGroupingSuggestion = (todaysTasks: Task[]): boolean =>
  todaysTasks.some((task) => task.status !== 'done');
