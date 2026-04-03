export const getAlphabeticalCategories = (categories: string[]) =>
  [...categories].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
