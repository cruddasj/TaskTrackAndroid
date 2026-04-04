import { Task } from '../types';

type PlanningDay = 'today' | 'tomorrow';

export const getTaskPrimaryActionLabel = (planningDay: PlanningDay, taskStatus: Task['status']): string => {
  if (planningDay === 'tomorrow') return 'Move to today';
  return taskStatus === 'done' ? 'Mark as to-do' : 'Mark as done';
};
