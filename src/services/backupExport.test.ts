const isNativePlatformMock = jest.fn();
const getPlatformMock = jest.fn();
const writeFileMock = jest.fn();
const getUriMock = jest.fn();
const shareMock = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
    getPlatform: getPlatformMock,
  },
}));

jest.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: writeFileMock,
    getUri: getUriMock,
  },
  Directory: {
    Cache: 'CACHE',
  },
  Encoding: {
    UTF8: 'utf8',
  },
}));

jest.mock('@capacitor/share', () => ({
  Share: {
    share: shareMock,
  },
}));

import { exportBackupFile } from './backupExport';

describe('exportBackupFile', () => {
  const createObjectUrlMock = jest.fn();
  const revokeObjectUrlMock = jest.fn();
  let clickSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    isNativePlatformMock.mockReturnValue(false);
    getPlatformMock.mockReturnValue('web');
    createObjectUrlMock.mockReturnValue('blob:backup-url');
    getUriMock.mockResolvedValue({ uri: 'content://tmp/tasktrack.json' });
    writeFileMock.mockResolvedValue(undefined);
    shareMock.mockResolvedValue(undefined);

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrlMock,
    });

    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it('downloads the backup file by default', async () => {
    const method = await exportBackupFile('{"ok":true}', 'tasktrack.json');

    expect(method).toBe('download');
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:backup-url');
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('uses capacitor share on Android native', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');

    const method = await exportBackupFile('{"ok":true}', 'tasktrack.json');

    expect(method).toBe('share');
    expect(writeFileMock).toHaveBeenCalledWith(expect.objectContaining({
      path: 'tasktrack.json',
      data: '{"ok":true}',
      directory: 'CACHE',
    }));
    expect(getUriMock).toHaveBeenCalledWith(expect.objectContaining({
      path: 'tasktrack.json',
      directory: 'CACHE',
    }));
    expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({
      url: 'content://tmp/tasktrack.json',
      title: 'TaskTrack backup',
    }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('returns cancelled when native share is cancelled', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');
    shareMock.mockRejectedValue(new Error('Share canceled'));

    const method = await exportBackupFile('{"ok":true}', 'tasktrack.json');

    expect(method).toBe('cancelled');
  });
});
