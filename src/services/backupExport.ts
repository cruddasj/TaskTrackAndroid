import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export type BackupExportMethod = 'download' | 'filesystem';

const downloadBackupFile = (backupJson: string, fileName: string): void => {
  const blob = new Blob([backupJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const saveBackupFileOnAndroid = async (backupJson: string, fileName: string): Promise<BackupExportMethod> => {
  await Filesystem.writeFile({
    path: fileName,
    data: backupJson,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  return 'filesystem';
};

export const exportBackupFile = async (backupJson: string, fileName: string): Promise<BackupExportMethod> => {
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  if (!isAndroidNative) {
    downloadBackupFile(backupJson, fileName);
    return 'download';
  }

  return saveBackupFileOnAndroid(backupJson, fileName);
};
