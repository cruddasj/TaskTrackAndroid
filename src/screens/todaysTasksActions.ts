import { Task } from '../types';

type PlanningDay = 'today' | 'tomorrow';

export const getTaskPrimaryActionLabel = (planningDay: PlanningDay, taskStatus: Task['status']): string => {
  if (planningDay === 'tomorrow') return 'Move to today';
  return taskStatus === 'done' ? 'Mark as to-do' : 'Mark as done';
};

export const getTaskSecondaryActionLabel = (planningDay: PlanningDay): string | null => {
  if (planningDay === 'today') return 'Move to tomorrow';
  return null;
};

export const shouldShowTodoSection = (todoTaskCount: number): boolean => todoTaskCount > 0;

export const shouldShowDoneHeading = (planningDay: PlanningDay, doneTaskCount: number): boolean => {
  if (planningDay === 'tomorrow') return doneTaskCount > 0;
  return true;
};
