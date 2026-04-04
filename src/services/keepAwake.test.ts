const isNativePlatformMock = jest.fn();
const keepAwakeMock = jest.fn();
const allowSleepMock = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
  },
}));

jest.mock(
  '@capacitor-community/keep-awake',
  () => ({
    KeepAwake: {
      keepAwake: keepAwakeMock,
      allowSleep: allowSleepMock,
    },
  }),
  { virtual: true },
);

import { allowScreenSleep, keepScreenAwake } from './keepAwake';

describe('keepAwake service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isNativePlatformMock.mockReturnValue(false);
    keepAwakeMock.mockResolvedValue(undefined);
    allowSleepMock.mockResolvedValue(undefined);
  });

  it('keeps the screen awake on native platforms', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await keepScreenAwake();

    expect(keepAwakeMock).toHaveBeenCalledTimes(1);
  });

  it('does not call keep-awake on web', async () => {
    await keepScreenAwake();

    expect(keepAwakeMock).not.toHaveBeenCalled();
  });

  it('allows screen sleep on native platforms', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await allowScreenSleep();

    expect(allowSleepMock).toHaveBeenCalledTimes(1);
  });

  it('does not call allow-sleep on web', async () => {
    await allowScreenSleep();

    expect(allowSleepMock).not.toHaveBeenCalled();
  });
});
