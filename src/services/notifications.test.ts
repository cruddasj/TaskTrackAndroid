const scheduleMock = jest.fn();
const requestPermissionsMock = jest.fn();
const getPendingMock = jest.fn();
const cancelMock = jest.fn();
const removeAllDeliveredNotificationsMock = jest.fn();
const isNativePlatformMock = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
  },
}));

jest.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: scheduleMock,
    requestPermissions: requestPermissionsMock,
    getPending: getPendingMock,
    cancel: cancelMock,
    removeAllDeliveredNotifications: removeAllDeliveredNotificationsMock,
  },
}));

import {
  dismissNativeAlarmNotifications,
  notifyPomodoroComplete,
  playAlarmTone,
  requestNotificationPermissions,
  startRepeatingAlarm,
} from './notifications';

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    isNativePlatformMock.mockReturnValue(false);
  });

  it('requests native permissions on native platforms', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await requestNotificationPermissions();

    expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
  });

  it('schedules repeated native notifications', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await notifyPomodoroComplete('Done', 'Body', 'bell', 3);

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    const payload = scheduleMock.mock.calls[0][0];
    expect(payload.notifications).toHaveLength(3);
  });

  it('requests browser notification permission on web when permission is default', async () => {
    const requestPermission = jest.fn().mockResolvedValue('granted');
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'default', requestPermission },
    });

    await requestNotificationPermissions();

    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('shows browser notification on web when permission is granted', async () => {
    const notificationConstructor = jest.fn();
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: Object.assign(notificationConstructor, { permission: 'granted' }),
    });

    await notifyPomodoroComplete('Done', 'Body', 'bell', 2);

    expect(notificationConstructor).toHaveBeenCalledWith('Done', { body: 'Body' });
  });

  it('cancels and clears pending native notifications', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPendingMock.mockResolvedValue({ notifications: [{ id: 1 }, { id: 2 }] });

    await dismissNativeAlarmNotifications();

    expect(cancelMock).toHaveBeenCalledWith({ notifications: [{ id: 1 }, { id: 2 }] });
    expect(removeAllDeliveredNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it('returns early when dismissing notifications on web', async () => {
    await dismissNativeAlarmNotifications();
    expect(getPendingMock).not.toHaveBeenCalled();
  });

  it('plays all alarm tone variants through AudioContext', () => {
    const createOscillator = () => ({
      type: 'triangle',
      frequency: { value: 0 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    });
    const createGain = () => ({
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    });
    const AudioContextMock = jest.fn().mockImplementation(() => ({
      currentTime: 0,
      destination: {},
      createOscillator,
      createGain,
    }));
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: AudioContextMock });

    playAlarmTone('bell');
    playAlarmTone('chime');
    playAlarmTone('digital');

    expect(AudioContextMock).toHaveBeenCalledTimes(3);
  });

  it('plays a finite number of repeats and calls completion callback once', () => {
    jest.useFakeTimers();
    const player = jest.fn();
    const onComplete = jest.fn();

    startRepeatingAlarm('chime', 3, onComplete, player);
    jest.advanceTimersByTime(5000);

    expect(player).toHaveBeenCalledTimes(3);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('can dismiss before all repeats finish', () => {
    jest.useFakeTimers();
    const player = jest.fn();
    const onComplete = jest.fn();

    const stop = startRepeatingAlarm('digital', 4, onComplete, player);
    stop();
    jest.advanceTimersByTime(10000);

    expect(player).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
