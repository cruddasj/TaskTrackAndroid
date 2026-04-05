export const shouldPlayInAppCompletionAlarm = (isNativePlatform: boolean, appIsActive: boolean): boolean => (
  !isNativePlatform || appIsActive
);

export const shouldSendCompletionNotification = (isNativePlatform: boolean, appIsActive: boolean): boolean => (
  !isNativePlatform || !appIsActive
);
