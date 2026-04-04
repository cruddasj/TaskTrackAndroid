import { TaskBankItem } from '../types';
import { getNormalizedRecurrenceDays, getTaskBankFormRecurrenceMode } from './taskBankRecurrence';

describe('TaskBankScreen recurrence helpers', () => {
  it('maps recurrence days of one to the daily form mode', () => {
    const task: TaskBankItem = {
      id: 'bank-1',
      title: 'Daily standup notes',
      description: '',
      category: 'Work',
      estimateMinutes: 10,
      recurrenceDays: 1,
    };

    expect(getTaskBankFormRecurrenceMode(task)).toBe('daily');
  });

  it('normalizes daily mode to one day recurrence', () => {
    expect(getNormalizedRecurrenceDays('daily', '')).toBe(1);
  });
});
