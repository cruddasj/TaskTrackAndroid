import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type AlarmTone = 'bell' | 'chime' | 'digital';

const ALARM_REPEAT_INTERVAL_MS = 2500;

export const requestNotificationPermissions = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.requestPermissions();
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
  repeatCount: number,
): Promise<void> => {
  const safeRepeatCount = Math.max(1, Math.round(repeatCount));

  if (Capacitor.isNativePlatform()) {
    const now = Date.now();
    await LocalNotifications.schedule({
      notifications: Array.from({ length: safeRepeatCount }, (_, index) => ({
        id: now + index,
        title,
        body,
        schedule: { at: new Date(now + 200 + index * ALARM_REPEAT_INTERVAL_MS) },
        sound: `res://raw/alarm_${tone}`,
      })),
    });
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export const dismissNativeAlarmNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) });
  }
  await LocalNotifications.removeAllDeliveredNotifications();
};

const playTonePattern = (context: AudioContext, tone: AlarmTone): void => {
  const now = context.currentTime;

  const beep = (start: number, freq: number, type: OscillatorType = 'triangle', length = 0.32) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
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

  beep(now, 784);
  beep(now + 0.18, 988);
  beep(now + 0.36, 1318);
};

export const playAlarmTone = (tone: AlarmTone): void => {
  const context = new AudioContext();
  playTonePattern(context, tone);
};

export const startRepeatingAlarm = (
  tone: AlarmTone,
  repeatCount: number,
  onComplete?: () => void,
  player: (nextTone: AlarmTone) => void = playAlarmTone,
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
    player(tone);
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
