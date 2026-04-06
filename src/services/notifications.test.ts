const scheduleMock = jest.fn();
const createChannelMock = jest.fn();
const requestPermissionsMock = jest.fn();
const checkPermissionsMock = jest.fn();
const getPendingMock = jest.fn();
const cancelMock = jest.fn();
const removeAllDeliveredNotificationsMock = jest.fn();
const isNativePlatformMock = jest.fn();
const hapticsNotificationMock = jest.fn();
const hapticsVibrateMock = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
  },
}));

jest.mock(
  '@capacitor/haptics',
  () => ({
    Haptics: {
      notification: hapticsNotificationMock,
      vibrate: hapticsVibrateMock,
    },
    NotificationType: {
      Success: 'SUCCESS',
    },
  }),
  { virtual: true },
);

jest.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: scheduleMock,
    createChannel: createChannelMock,
    requestPermissions: requestPermissionsMock,
    checkPermissions: checkPermissionsMock,
    getPending: getPendingMock,
    cancel: cancelMock,
    removeAllDeliveredNotifications: removeAllDeliveredNotificationsMock,
  },
}));

import {
  clearActivePomodoroNotification,
  clearScheduledPomodoroPhaseEndNotification,
  dismissNativeAlarmNotifications,
  logNativeNotificationDiagnosticsOnStart,
  notifyPomodoroComplete,
  playAlarmTone,
  requestNotificationPermissions,
  schedulePomodoroPhaseEndNotification,
  syncActivePomodoroNotification,
  startRepeatingAlarm,
} from './notifications';

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    isNativePlatformMock.mockReturnValue(false);
    checkPermissionsMock.mockResolvedValue({ display: 'granted' });
    requestPermissionsMock.mockResolvedValue({ display: 'granted' });
    hapticsNotificationMock.mockResolvedValue(undefined);
    hapticsVibrateMock.mockResolvedValue(undefined);
  });

  it('requests native permissions on native platforms when needed', async () => {
    isNativePlatformMock.mockReturnValue(true);
    checkPermissionsMock.mockResolvedValue({ display: 'denied' });

    await requestNotificationPermissions();

    expect(checkPermissionsMock).toHaveBeenCalledTimes(1);
    expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
  });

  it('schedules a native phase-end notification', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await schedulePomodoroPhaseEndNotification(1234, 1_700_000_000_000, 75_000, 'Done', 'Body', 'clock_bell');

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    const payload = scheduleMock.mock.calls[0][0];
    expect(createChannelMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'pomodoro',
      importance: 5,
    }));
    expect(payload.notifications).toHaveLength(1);
    expect(payload.notifications[0]).toEqual(expect.objectContaining({
      id: 1234,
      channelId: 'round-finish-clock_bell-v5',
      title: 'Done',
      body: 'Body',
      sound: 'alarm_clock_bell.mp3',
      smallIcon: 'ic_stat_timer',
      schedule: expect.objectContaining({ allowWhileIdle: true }),
    }));
  });


  it('does not schedule native phase-end notifications when notification permission is denied', async () => {
    isNativePlatformMock.mockReturnValue(true);
    checkPermissionsMock.mockResolvedValue({ display: 'denied' });
    requestPermissionsMock.mockResolvedValue({ display: 'denied' });

    await schedulePomodoroPhaseEndNotification(1234, Date.now(), 30_000, 'Done', 'Body', 'clock_bell');

    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it('schedules an immediate native notification on completion', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await notifyPomodoroComplete('Done', 'Body', 'clock_bell');

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    const payload = scheduleMock.mock.calls[0][0];
    expect(payload.notifications).toHaveLength(1);
    expect(payload.notifications[0]).toEqual(expect.objectContaining({
      title: 'Done',
      body: 'Body',
      channelId: 'round-finish-clock_bell-v5',
      sound: 'alarm_clock_bell.mp3',
      smallIcon: 'ic_stat_timer',
    }));
  });

  it('logs native raw alarm diagnostics on app startup', () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    isNativePlatformMock.mockReturnValue(true);

    logNativeNotificationDiagnosticsOnStart();

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[notifications] Startup native alarm resource diagnostics',
      expect.objectContaining({
        rawDirectory: 'res://raw',
        files: expect.arrayContaining(['alarm_clock_bell.mp3', 'alarm_fallout.mp3', 'alarm_chirp.mp3', 'alarm_digital.mp3']),
      }),
    );
    consoleInfoSpy.mockRestore();
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

    await notifyPomodoroComplete('Done', 'Body', 'clock_bell');

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

  it('clears the scheduled native phase-end notification', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await clearScheduledPomodoroPhaseEndNotification(42);

    expect(cancelMock).toHaveBeenCalledWith({ notifications: [{ id: 42 }] });
  });

  it('syncs an ongoing native notification for active timer state', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-04T09:00:00Z'));
    isNativePlatformMock.mockReturnValue(true);

    await syncActivePomodoroNotification('work', 301);

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    const payload = scheduleMock.mock.calls[0][0];
    expect(createChannelMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'pomodoro-active-timer',
      importance: 2,
    }));
    expect(payload.notifications[0]).toEqual(expect.objectContaining({
      id: 91100001,
      title: 'TaskTrack timer running',
      body: 'Focus round ends at 09:05',
      ongoing: true,
      autoCancel: false,
      channelId: 'pomodoro-active-timer',
      smallIcon: 'ic_stat_timer',
    }));
  });

  it('clears the active timer notification on native platforms', async () => {
    isNativePlatformMock.mockReturnValue(true);

    await clearActivePomodoroNotification();

    expect(cancelMock).toHaveBeenCalledWith({ notifications: [{ id: 91100001 }] });
  });

  it('falls back to vibrate when haptics notification feedback fails', async () => {
    jest.useFakeTimers();
    const player = jest.fn();
    hapticsNotificationMock.mockRejectedValueOnce(new Error('unsupported'));

    startRepeatingAlarm('clock_bell', 1, 0.7, undefined, player);
    await Promise.resolve();

    expect(hapticsNotificationMock).toHaveBeenCalledTimes(1);
    expect(hapticsVibrateMock).toHaveBeenCalledWith({ duration: 300 });
  });


  it('resolves web alarm tone URLs from the current base path', () => {
    const playMock = jest.fn().mockResolvedValue(undefined);
    const AudioMock = jest.fn().mockImplementation(() => ({
      volume: 0,
      play: playMock,
    }));
    Object.defineProperty(window, 'Audio', { configurable: true, value: AudioMock });

    window.history.replaceState({}, '', '/tasktrack/focus');
    playAlarmTone('clock_bell');

    const src = AudioMock.mock.calls[0][0] as string;
    expect(src).toContain('/tasktrack/custom_alarm_sounds/alarm_clock_bell.mp3');
  });

  it('plays all alarm tone variants through the Audio element', () => {
    const playMock = jest.fn().mockResolvedValue(undefined);
    const AudioMock = jest.fn().mockImplementation(() => ({
      volume: 0,
      play: playMock,
    }));
    Object.defineProperty(window, 'Audio', { configurable: true, value: AudioMock });

    playAlarmTone('clock_bell');
    playAlarmTone('fallout');
    playAlarmTone('chirp');
    playAlarmTone('digital');

    expect(AudioMock).toHaveBeenCalledTimes(4);
    expect(AudioMock).toHaveBeenNthCalledWith(1, expect.stringContaining('custom_alarm_sounds/alarm_clock_bell.mp3'));
    expect(AudioMock).toHaveBeenNthCalledWith(2, expect.stringContaining('custom_alarm_sounds/alarm_fallout.mp3'));
    expect(AudioMock).toHaveBeenNthCalledWith(3, expect.stringContaining('custom_alarm_sounds/alarm_chirp.mp3'));
    expect(AudioMock).toHaveBeenNthCalledWith(4, expect.stringContaining('custom_alarm_sounds/alarm_digital.mp3'));
  });

  it('plays a finite number of repeats and calls completion callback once', () => {
    jest.useFakeTimers();
    const player = jest.fn();
    const onComplete = jest.fn();

    startRepeatingAlarm('chirp', 3, 0.5, onComplete, player);
    jest.advanceTimersByTime(5000);

    expect(player).toHaveBeenCalledTimes(3);
    expect(hapticsNotificationMock).toHaveBeenCalledTimes(3);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('can dismiss before all repeats finish', () => {
    jest.useFakeTimers();
    const player = jest.fn();
    const onComplete = jest.fn();

    const stop = startRepeatingAlarm('digital', 4, 0.8, onComplete, player);
    stop();
    jest.advanceTimersByTime(10000);

    expect(player).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
