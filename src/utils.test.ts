import { normalizeOptionalDescription } from './utils';

describe('normalizeOptionalDescription', () => {
  it('returns an empty string when description is blank', () => {
    expect(normalizeOptionalDescription('   ')).toBe('');
  });

  it('returns trimmed text when description is provided', () => {
    expect(normalizeOptionalDescription('  Plan next sprint  ')).toBe('Plan next sprint');
  });
});
