import { TaskBankItem } from '../types';
import { getDefaultSelectedRecurringSuggestionIds, getSelectedRecurringSuggestions } from './todaysTaskSuggestions';

const recurringSuggestions: TaskBankItem[] = [
  { id: 'a', title: 'A', description: '', category: 'General', estimateMinutes: 10, recurrenceDays: 1, recurrenceWeekdays: [] },
  { id: 'b', title: 'B', description: '', category: 'General', estimateMinutes: 15, recurrenceDays: 3, recurrenceWeekdays: [] },
];

describe('todaysTaskSuggestions helpers', () => {
  it('selects all recurring suggestions by default', () => {
    expect(getDefaultSelectedRecurringSuggestionIds(recurringSuggestions)).toEqual(['a', 'b']);
  });

  it('returns only selected recurring suggestions', () => {
    expect(getSelectedRecurringSuggestions(recurringSuggestions, ['b'])).toEqual([recurringSuggestions[1]]);
  });
});
