import { BackupExportResult } from '../services/backupExport';

export const getBackupExportSuccessMessage = (exportResult: BackupExportResult, isEncrypted: boolean): string => {
  if (exportResult.method === 'filesystem') {
    if (exportResult.uri) {
      return isEncrypted
        ? `Encrypted backup saved: ${exportResult.uri}.`
        : `Backup saved: ${exportResult.uri}.`;
    }

    if (exportResult.folder) {
      return isEncrypted
        ? `Encrypted backup saved to ${exportResult.folder} as ${exportResult.fileName}.`
        : `Backup saved to ${exportResult.folder} as ${exportResult.fileName}.`;
    }

    return isEncrypted ? 'Encrypted backup saved.' : 'Backup saved.';
  }

  return isEncrypted ? 'Encrypted backup exported.' : 'Backup exported.';
};
