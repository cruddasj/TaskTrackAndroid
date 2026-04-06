export const shouldPlayInAppCompletionAlarm = (isNativePlatform: boolean, appIsActive: boolean): boolean => (
  !isNativePlatform || appIsActive
);

export const shouldSendCompletionNotification = (isNativePlatform: boolean, appIsActive: boolean): boolean => (
  !isNativePlatform || !appIsActive
);

export const shouldSkipInAppAlarmAfterRecentResume = (
  isNativePlatform: boolean,
  resumedAt: number | null,
  now: number,
  resumeGraceMs = 3000,
): boolean => (
  isNativePlatform
  && resumedAt !== null
  && now - resumedAt >= 0
  && now - resumedAt <= resumeGraceMs
);
