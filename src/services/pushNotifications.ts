import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

let pushNotificationsInitialized = false;
const ANDROID_HIGH_PRIORITY_CHANNEL_ID = 'tasktrack-high-priority';

const ensureAndroidHighPriorityChannel = async (): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;
  await PushNotifications.createChannel({
    id: ANDROID_HIGH_PRIORITY_CHANNEL_ID,
    name: 'TaskTrack alerts',
    description: 'High-priority TaskTrack notifications.',
    importance: 5,
    visibility: 1,
    vibration: true,
  });
};

export const resetPushNotificationsInitializationForTests = (): void => {
  pushNotificationsInitialized = false;
};

export const initializePushNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || pushNotificationsInitialized) return;

  pushNotificationsInitialized = true;

  try {
    await ensureAndroidHighPriorityChannel();
  } catch (error) {
    console.warn('Unable to initialize Android high-priority push channel.', error);
  }

  await PushNotifications.addListener('registration', (token) => {
    console.info('Push registration token received.', token.value);
  });

  await PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration failed.', error);
  });

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.info('Push notification received.', notification.id);
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.info('Push notification opened.', notification.actionId);
  });

  let permissionStatus = await PushNotifications.checkPermissions();
  if (permissionStatus.receive === 'prompt') {
    permissionStatus = await PushNotifications.requestPermissions();
  }
  if (permissionStatus.receive !== 'granted') return;

  await PushNotifications.register();
};
