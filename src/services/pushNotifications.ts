import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

let pushNotificationsInitialized = false;

export const resetPushNotificationsInitializationForTests = (): void => {
  pushNotificationsInitialized = false;
};

export const initializePushNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || pushNotificationsInitialized) return;
  if (Capacitor.getPlatform() === 'android') {
    console.info('Skipping push registration on Android until Firebase is configured.');
    return;
  }

  pushNotificationsInitialized = true;

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
