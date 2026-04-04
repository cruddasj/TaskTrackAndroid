export const getActiveNotificationRemainingSeconds = (remainingSeconds: number, isAppActive: boolean): number => {
  if (isAppActive) return remainingSeconds;
  return Math.ceil(remainingSeconds / 60) * 60;
};
