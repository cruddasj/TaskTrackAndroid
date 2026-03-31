import { TaskBankItem } from '../types';

export const getDefaultSelectedRecurringSuggestionIds = (suggestions: TaskBankItem[]): string[] =>
  suggestions.map((suggestion) => suggestion.id);

export const getSelectedRecurringSuggestions = (suggestions: TaskBankItem[], selectedIds: string[]): TaskBankItem[] =>
  suggestions.filter((suggestion) => selectedIds.includes(suggestion.id));
