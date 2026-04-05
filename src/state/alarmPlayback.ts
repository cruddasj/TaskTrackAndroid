export const shouldPlayInAppCompletionAlarm = (isNativePlatform: boolean, appIsActive: boolean): boolean => (
  !isNativePlatform || appIsActive
);
