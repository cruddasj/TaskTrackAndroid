import { TaskBankItem } from '../types';

export type TaskBankRecurrenceMode = 'none' | 'daily' | 'days' | 'weekdays' | 'monthDay';

export const getTaskBankFormRecurrenceMode = (task: TaskBankItem): TaskBankRecurrenceMode => {
  if (task.recurrenceWeekdays && task.recurrenceWeekdays.length > 0) return 'weekdays';
  if (task.recurrenceDayOfMonth) return 'monthDay';
  if (task.recurrenceDays === 1) return 'daily';
  if (task.recurrenceDays) return 'days';
  return 'none';
};

export const getNormalizedRecurrenceDays = (recurrenceMode: TaskBankRecurrenceMode, recurrenceDaysValue: string): number | undefined => {
  if (recurrenceMode === 'daily') return 1;
  const recurrenceDays = Number(recurrenceDaysValue);
  if (recurrenceMode === 'days' && Number.isFinite(recurrenceDays) && recurrenceDays > 0) return Math.round(recurrenceDays);
  return undefined;
};
