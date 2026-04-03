import { Capacitor } from '@capacitor/core';

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

export const exportBackupFile = async (backupJson: string, fileName: string): Promise<BackupExportMethod> => {
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  if (!isAndroidNative || !hasNativeShare) {
    downloadBackupFile(backupJson, fileName);
    return 'download';
  }

  const backupFile = new File([backupJson], fileName, { type: 'application/json' });
  const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [backupFile] });

  if (!canShareFiles) {
    downloadBackupFile(backupJson, fileName);
    return 'download';
  }

  try {
    await navigator.share({
      files: [backupFile],
      title: 'TaskTrack backup',
      text: 'Choose where to save your TaskTrack backup file.',
    });
    return 'share';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled';
    }
    throw error;
  }
};
