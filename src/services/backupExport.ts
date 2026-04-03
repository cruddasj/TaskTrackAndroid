import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type BackupExportMethod = 'download' | 'share' | 'cancelled';

const downloadBackupFile = (backupJson: string, fileName: string): void => {
  const blob = new Blob([backupJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const shareBackupFileOnAndroid = async (backupJson: string, fileName: string): Promise<BackupExportMethod> => {
  try {
    await Filesystem.writeFile({
      path: fileName,
      data: backupJson,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });

    const backupUri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'TaskTrack backup',
      text: 'Choose where to save your TaskTrack backup file.',
      files: [backupUri.uri],
      dialogTitle: 'Export backup',
    });

    return 'share';
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) {
      return 'cancelled';
    }
    throw error;
  }
};

export const exportBackupFile = async (backupJson: string, fileName: string): Promise<BackupExportMethod> => {
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  if (!isAndroidNative) {
    downloadBackupFile(backupJson, fileName);
    return 'download';
  }

  return shareBackupFileOnAndroid(backupJson, fileName);
};
