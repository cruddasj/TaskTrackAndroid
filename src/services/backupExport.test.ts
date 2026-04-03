const isNativePlatformMock = jest.fn();
const getPlatformMock = jest.fn();
const writeFileMock = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
    getPlatform: getPlatformMock,
  },
}));

jest.mock(
  '@capacitor/filesystem',
  () => ({
    Filesystem: {
      writeFile: writeFileMock,
    },
    Directory: {
      Documents: 'DOCUMENTS',
    },
    Encoding: {
      UTF8: 'utf8',
    },
  }),
  { virtual: true },
);

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
    writeFileMock.mockResolvedValue(undefined);

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
  });

  it('saves the backup file to Android documents storage on Android native', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');

    const method = await exportBackupFile('{"ok":true}', 'tasktrack.json');

    expect(method).toBe('filesystem');
    expect(writeFileMock).toHaveBeenCalledWith(expect.objectContaining({
      path: 'tasktrack.json',
      data: '{"ok":true}',
      directory: 'DOCUMENTS',
    }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('throws when Android filesystem write fails', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');
    writeFileMock.mockRejectedValue(new Error('Write failed'));

    await expect(exportBackupFile('{"ok":true}', 'tasktrack.json')).rejects.toThrow('Write failed');
  });
});
