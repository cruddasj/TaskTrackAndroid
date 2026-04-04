const isNativePlatformMock = jest.fn();
const getPlatformMock = jest.fn();
const addListenerMock = jest.fn().mockResolvedValue({ remove: jest.fn() });
const checkPermissionsMock = jest.fn();
const requestPermissionsMock = jest.fn();
const registerMock = jest.fn();
const createChannelMock = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
    getPlatform: getPlatformMock,
  },
}));

jest.mock(
  '@capacitor/push-notifications',
  () => ({
    PushNotifications: {
      addListener: addListenerMock,
      checkPermissions: checkPermissionsMock,
      requestPermissions: requestPermissionsMock,
      register: registerMock,
      createChannel: createChannelMock,
    },
  }),
  { virtual: true },
);

import { initializePushNotifications, resetPushNotificationsInitializationForTests } from './pushNotifications';

describe('push notification service', () => {
  beforeEach(() => {
    resetPushNotificationsInitializationForTests();
    jest.clearAllMocks();
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('ios');
    checkPermissionsMock.mockResolvedValue({ receive: 'granted' });
    requestPermissionsMock.mockResolvedValue({ receive: 'granted' });
  });

  it('registers for push notifications when permission is granted', async () => {
    await initializePushNotifications();

    expect(addListenerMock).toHaveBeenCalledTimes(4);
    expect(checkPermissionsMock).toHaveBeenCalledTimes(1);
    expect(registerMock).toHaveBeenCalledTimes(1);
  });

  it('requests permissions when prompt is returned', async () => {
    checkPermissionsMock.mockResolvedValue({ receive: 'prompt' });

    await initializePushNotifications();

    expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
    expect(registerMock).toHaveBeenCalledTimes(1);
  });

  it('does not register when user denies permissions', async () => {
    checkPermissionsMock.mockResolvedValue({ receive: 'denied' });

    await initializePushNotifications();

    expect(registerMock).not.toHaveBeenCalled();
  });

  it('skips android registration to avoid Firebase crashes when messaging is not configured', async () => {
    getPlatformMock.mockReturnValue('android');

    await initializePushNotifications();

    expect(createChannelMock).not.toHaveBeenCalled();
    expect(addListenerMock).not.toHaveBeenCalled();
    expect(checkPermissionsMock).not.toHaveBeenCalled();
    expect(registerMock).not.toHaveBeenCalled();
  });
});
