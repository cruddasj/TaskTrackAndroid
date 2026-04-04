import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export type BackupExportResult = {
  method: 'download' | 'filesystem';
  fileName: string;
  folder?: 'Documents';
  uri?: string;
};

const downloadBackupFile = (backupJson: string, fileName: string): void => {
  const blob = new Blob([backupJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const saveBackupFileOnAndroid = async (backupJson: string, fileName: string): Promise<BackupExportResult> => {
  await Filesystem.writeFile({
    path: fileName,
    data: backupJson,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  let uri: string | undefined;
  try {
    const uriResult = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Documents,
    });
    uri = uriResult.uri;
  } catch {
    uri = undefined;
  }

  return {
    method: 'filesystem',
    fileName,
    folder: 'Documents',
    uri,
  };
};

export const exportBackupFile = async (backupJson: string, fileName: string): Promise<BackupExportResult> => {
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  if (!isAndroidNative) {
    downloadBackupFile(backupJson, fileName);
    return {
      method: 'download',
      fileName,
    };
  }

  return saveBackupFileOnAndroid(backupJson, fileName);
};
