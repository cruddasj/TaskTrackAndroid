import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { formatRemainingEndTime } from '../utils';

export type AlarmTone = 'bell' | 'chime' | 'digital' | 'gentle' | 'pulse';

const ALARM_REPEAT_INTERVAL_MS = 2500;
const ANDROID_CHANNEL_VERSION = 'v2';
const POMODORO_CHANNEL_ID = 'pomodoro';
const ACTIVE_TIMER_CHANNEL_ID = 'pomodoro-active-timer';
const ACTIVE_TIMER_NOTIFICATION_ID = 91_100_001;


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
  await LocalNotifications.createChannel({
    id: channelId,
    name: 'Round completion alerts',
    description: 'Alerts when a focus round or break completes.',
    sound: `raw/alarm_${tone}`,
    importance: 5,
    visibility: 1,
    vibration: true,
  });
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
  _repeatCount: number,
): Promise<void> => {
  void _repeatCount;
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

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title,
          body,
          ...(channelId
            ? {
              channelId,
              sound: `res://raw/alarm_${tone}`,
            }
            : undefined),
        },
      ],
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

  await LocalNotifications.cancel({ notifications: [{ id: sessionId }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: sessionId,
        title,
        body,
        schedule: { at: fireAt, allowWhileIdle: true },
        channelId: channelId ?? POMODORO_CHANNEL_ID,
        ...(channelId
          ? {
            sound: `res://raw/alarm_${tone}`,
          }
          : undefined),
      },
    ],
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

const playTonePattern = (context: AudioContext, tone: AlarmTone, volume: number): void => {
  const now = context.currentTime;
  const safeVolume = Math.max(0, Math.min(1, volume));

  const beep = (start: number, freq: number, type: OscillatorType = 'triangle', length = 0.32) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeVolume * 0.25), start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.08, length - 0.02));
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + length);
  };

  if (tone === 'chime') {
    beep(now, 523, 'sine', 0.38);
    beep(now + 0.2, 659, 'sine', 0.38);
    beep(now + 0.4, 784, 'sine', 0.42);
    return;
  }

  if (tone === 'digital') {
    beep(now, 880, 'square', 0.18);
    beep(now + 0.22, 880, 'square', 0.18);
    beep(now + 0.44, 1244, 'square', 0.24);
    return;
  }

  if (tone === 'gentle') {
    beep(now, 440, 'sine', 0.4);
    beep(now + 0.24, 554, 'sine', 0.4);
    beep(now + 0.48, 659, 'sine', 0.45);
    return;
  }

  if (tone === 'pulse') {
    beep(now, 420, 'square', 0.1);
    beep(now + 0.14, 480, 'square', 0.1);
    beep(now + 0.28, 540, 'square', 0.1);
    beep(now + 0.42, 600, 'square', 0.14);
    return;
  }

  beep(now, 784);
  beep(now + 0.18, 988);
  beep(now + 0.36, 1318);
};

export const playAlarmTone = (tone: AlarmTone, volume = 0.7): void => {
  const context = new AudioContext();
  playTonePattern(context, tone, volume);
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
