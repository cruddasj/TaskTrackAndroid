import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ALARM_TONES, AlarmTone } from '../constants/alarmTones';
import { formatRemainingEndTime } from '../utils';

const ALARM_REPEAT_INTERVAL_MS = 2500;
const ANDROID_CHANNEL_VERSION = 'v5';
const POMODORO_CHANNEL_ID = 'pomodoro';
const ACTIVE_TIMER_CHANNEL_ID = 'pomodoro-active-timer';
const ACTIVE_TIMER_NOTIFICATION_ID = 91_100_001;
const ANDROID_TIMER_SMALL_ICON = 'ic_stat_timer';
const NATIVE_ALARM_FILE_EXTENSION = '.mp3';
const getAlarmFileName = (tone: AlarmTone): string => `alarm_${tone}`;
const getNativeAlarmSound = (tone: AlarmTone): string => `${getAlarmFileName(tone)}${NATIVE_ALARM_FILE_EXTENSION}`;
const getAlarmAudioAssetUrl = (tone: AlarmTone): string => {
  const alarmFile = `custom_alarm_sounds/${getAlarmFileName(tone)}.mp3`;
  return new URL(alarmFile, document.baseURI).toString();
};

const getNativeRawAlarmFiles = (): string[] => ALARM_TONES.map((tone) => `${getAlarmFileName(tone)}${NATIVE_ALARM_FILE_EXTENSION}`);

export const logNativeNotificationDiagnosticsOnStart = (): void => {
  if (!Capacitor.isNativePlatform()) return;

  console.info('[notifications] Startup native alarm resource diagnostics', {
    rawDirectory: 'res://raw',
    files: getNativeRawAlarmFiles(),
    localNotificationSoundUris: ALARM_TONES.map((tone) => getNativeAlarmSound(tone)),
  });
};


const triggerCompletionHaptic = async (): Promise<void> => {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    try {
      await Haptics.vibrate({ duration: 300 });
    } catch {
      // Devices without haptics support resolve with no effect or may throw depending on implementation.
    }
  }
};

const getAndroidAlarmChannelId = (tone: AlarmTone): string => `round-finish-${tone}-${ANDROID_CHANNEL_VERSION}`;

const ensureAndroidAlarmChannel = async (tone: AlarmTone): Promise<string> => {
  const channelId = getAndroidAlarmChannelId(tone);
  const channel: Parameters<typeof LocalNotifications.createChannel>[0] = {
    id: channelId,
    name: 'Round completion alerts',
    description: 'Alerts when a focus round or break completes.',
    sound: getNativeAlarmSound(tone),
    importance: 5,
    visibility: 1,
    vibration: true,
  };
  console.info('[notifications] Ensuring Android completion channel', channel);
  await LocalNotifications.createChannel(channel);
  return channelId;
};

const ensurePomodoroTimerChannel = async (): Promise<void> => {
  await LocalNotifications.createChannel({
    id: POMODORO_CHANNEL_ID,
    name: 'Pomodoro Timer',
    description: 'Scheduled Pomodoro timer completion reminders.',
    importance: 5,
    vibration: true,
  });
};

const ensureActivePomodoroTimerChannel = async (): Promise<void> => {
  await LocalNotifications.createChannel({
    id: ACTIVE_TIMER_CHANNEL_ID,
    name: 'Active timer',
    description: 'Shows the running TaskTrack timer in your notification panel.',
    importance: 2,
    vibration: false,
  });
};

const ensureNativeNotificationPermission = async (): Promise<boolean> => {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === 'granted';
};

export const requestNotificationPermissions = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await ensureNativeNotificationPermission();
    return;
  }

  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const notifyPomodoroComplete = async (
  title: string,
  body: string,
  tone: AlarmTone,
): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    const hasPermission = await ensureNativeNotificationPermission();
    if (!hasPermission) return;

    let channelId: string | undefined;
    try {
      channelId = await ensureAndroidAlarmChannel(tone);
    } catch {
      channelId = undefined;
    }

    await triggerCompletionHaptic();

    const notification = {
      id: Math.floor(Math.random() * 100000),
      title,
      body,
      sound: getNativeAlarmSound(tone),
      smallIcon: ANDROID_TIMER_SMALL_ICON,
      ...(channelId
        ? {
          channelId,
        }
        : undefined),
    };
    console.info('[notifications] Scheduling immediate native completion notification', notification);
    await LocalNotifications.schedule({
      notifications: [notification],
    });
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export const schedulePomodoroPhaseEndNotification = async (
  sessionId: number,
  startTime: number,
  durationMs: number,
  title: string,
  body: string,
  tone: AlarmTone,
): Promise<void> => {
  if (!Capacitor.isNativePlatform() || durationMs <= 0) return;

  const hasPermission = await ensureNativeNotificationPermission();
  if (!hasPermission) return;

  await ensurePomodoroTimerChannel();

  let channelId: string | undefined;
  try {
    channelId = await ensureAndroidAlarmChannel(tone);
  } catch {
    channelId = undefined;
  }

  const fireAt = new Date(startTime + durationMs);
  const notification = {
    id: sessionId,
    title,
    body,
    schedule: { at: fireAt, allowWhileIdle: true },
    channelId: channelId ?? POMODORO_CHANNEL_ID,
    sound: getNativeAlarmSound(tone),
    smallIcon: ANDROID_TIMER_SMALL_ICON,
  };

  await LocalNotifications.cancel({ notifications: [{ id: sessionId }] });
  console.info('[notifications] Scheduling native phase-end notification', notification);
  await LocalNotifications.schedule({
    notifications: [notification],
  });
};

export const clearScheduledPomodoroPhaseEndNotification = async (sessionId?: number | null): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  if (!sessionId) return;
  await LocalNotifications.cancel({ notifications: [{ id: sessionId }] });
};

export const syncActivePomodoroNotification = async (
  phase: 'work' | 'short_break' | 'long_break',
  remainingSeconds: number,
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  const hasPermission = await ensureNativeNotificationPermission();
  if (!hasPermission) return;

  await ensureActivePomodoroTimerChannel();
  const phaseLabel = phase === 'work' ? 'Focus round' : phase === 'short_break' ? 'Short break' : 'Long break';

  await LocalNotifications.schedule({
    notifications: [
      {
        id: ACTIVE_TIMER_NOTIFICATION_ID,
        title: 'TaskTrack timer running',
        body: `${phaseLabel} ends at ${formatRemainingEndTime(remainingSeconds)}`,
        channelId: ACTIVE_TIMER_CHANNEL_ID,
        smallIcon: ANDROID_TIMER_SMALL_ICON,
        ongoing: true,
        autoCancel: false,
      },
    ],
  });
};

export const clearActivePomodoroNotification = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: ACTIVE_TIMER_NOTIFICATION_ID }] });
};

export const dismissNativeAlarmNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id: Number(id) })) });
  }
  await LocalNotifications.removeAllDeliveredNotifications();
};

export const playAlarmTone = (tone: AlarmTone, volume = 0.7): void => {
  const audio = new Audio(getAlarmAudioAssetUrl(tone));
  audio.volume = Math.max(0, Math.min(1, volume));
  void audio.play().catch(() => {
    // Browsers may block autoplay before a user gesture.
  });
};

export const startRepeatingAlarm = (
  tone: AlarmTone,
  repeatCount: number,
  volume: number,
  onComplete?: () => void,
  player: (nextTone: AlarmTone, nextVolume: number) => void = playAlarmTone,
): (() => void) => {
  const safeRepeatCount = Math.max(1, Math.round(repeatCount));
  let playCount = 0;
  let completed = false;

  const finish = () => {
    if (completed) return;
    completed = true;
    onComplete?.();
  };

  const playOnce = () => {
    playCount += 1;
    player(tone, volume);
    void triggerCompletionHaptic();
    if (playCount >= safeRepeatCount) {
      finish();
      return true;
    }
    return false;
  };

  if (playOnce()) {
    return () => finish();
  }

  const interval = window.setInterval(() => {
    if (playOnce()) {
      window.clearInterval(interval);
    }
  }, ALARM_REPEAT_INTERVAL_MS);

  return () => {
    window.clearInterval(interval);
    finish();
  };
};
