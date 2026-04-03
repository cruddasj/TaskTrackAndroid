const isNativePlatformMock = jest.fn();
const getPlatformMock = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
    getPlatform: getPlatformMock,
  },
}));

import { exportBackupFile } from './backupExport';

describe('exportBackupFile', () => {
  const createObjectUrlMock = jest.fn();
  const revokeObjectUrlMock = jest.fn();
  const shareMock = jest.fn();
  const canShareMock = jest.fn();
  let clickSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    isNativePlatformMock.mockReturnValue(false);
    getPlatformMock.mockReturnValue('web');
    createObjectUrlMock.mockReturnValue('blob:backup-url');

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrlMock,
    });

    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      writable: true,
      value: shareMock,
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      writable: true,
      value: canShareMock,
    });
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
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('uses native share on Android when file sharing is supported', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');
    canShareMock.mockReturnValue(true);
    shareMock.mockResolvedValue(undefined);

    const method = await exportBackupFile('{"ok":true}', 'tasktrack.json');

    expect(method).toBe('share');
    expect(canShareMock).toHaveBeenCalledWith(expect.objectContaining({
      files: expect.any(Array),
    }));
    expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({
      files: expect.any(Array),
      title: 'TaskTrack backup',
    }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('returns cancelled when share is dismissed', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');
    canShareMock.mockReturnValue(true);
    shareMock.mockRejectedValue(new DOMException('cancelled', 'AbortError'));

    const method = await exportBackupFile('{"ok":true}', 'tasktrack.json');

    expect(method).toBe('cancelled');
  });
});
