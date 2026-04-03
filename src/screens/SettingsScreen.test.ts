import { getAlphabeticalCategories } from './settingsCategories';

describe('getAlphabeticalCategories', () => {
  it('returns categories in alphabetical order without mutating input', () => {
    const categories = ['work', 'Errands', 'Personal'];

    const sortedCategories = getAlphabeticalCategories(categories);

    expect(sortedCategories).toEqual(['Errands', 'Personal', 'work']);
    expect(categories).toEqual(['work', 'Errands', 'Personal']);
  });
});
