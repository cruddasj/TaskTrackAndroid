import { getAlphabeticalCategories } from './settingsCategories';
import { getBackupExportSuccessMessage } from './settingsBackupMessages';

describe('getAlphabeticalCategories', () => {
  it('returns categories in alphabetical order without mutating input', () => {
    const categories = ['work', 'Errands', 'Personal'];

    const sortedCategories = getAlphabeticalCategories(categories);

    expect(sortedCategories).toEqual(['Errands', 'Personal', 'work']);
    expect(categories).toEqual(['work', 'Errands', 'Personal']);
  });
});

describe('getBackupExportSuccessMessage', () => {
  it('uses vendor-neutral Documents messaging when android path uri is unavailable', () => {
    expect(getBackupExportSuccessMessage({
      method: 'filesystem',
      fileName: 'tasktrack-backup-2026-04-04.json',
      folder: 'Documents',
    }, false)).toBe('Backup saved to Documents as tasktrack-backup-2026-04-04.json.');

    expect(getBackupExportSuccessMessage({
      method: 'filesystem',
      fileName: 'tasktrack-backup-2026-04-04.json',
      folder: 'Documents',
    }, true)).toBe('Encrypted backup saved to Documents as tasktrack-backup-2026-04-04.json.');
  });

  it('prefers uri/path wording when available', () => {
    expect(getBackupExportSuccessMessage({
      method: 'filesystem',
      fileName: 'tasktrack-backup-2026-04-04.json',
      folder: 'Documents',
      uri: 'content://documents/tasktrack-backup-2026-04-04.json',
    }, false)).toBe('Backup saved: content://documents/tasktrack-backup-2026-04-04.json.');

    expect(getBackupExportSuccessMessage({
      method: 'filesystem',
      fileName: 'tasktrack-backup-2026-04-04.json',
      folder: 'Documents',
      uri: 'content://documents/tasktrack-backup-2026-04-04.json',
    }, true)).toBe('Encrypted backup saved: content://documents/tasktrack-backup-2026-04-04.json.');
  });
});
