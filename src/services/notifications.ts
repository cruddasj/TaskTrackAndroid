import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const requestNotificationPermissions = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.requestPermissions();
    return;
  }

  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const notifyPomodoroComplete = async (taskTitle: string): Promise<void> => {
  const title = 'Pomodoro complete';
  const body = `${taskTitle} is complete. Take a short break.`;

  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title,
          body,
          schedule: { at: new Date(Date.now() + 200) },
          sound: 'res://raw/alarm_bell',
        },
      ],
    });
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export const playAlarmBell = (): void => {
  const context = new AudioContext();
  const now = context.currentTime;

  const tone = (start: number, freq: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.32);
  };

  tone(now, 784);
  tone(now + 0.18, 988);
  tone(now + 0.36, 1318);
};
