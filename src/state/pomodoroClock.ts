export const getRemainingSecondsFromClock = (
  startedAt: number | null,
  totalSeconds: number,
  now: number = Date.now(),
): number => {
  if (!startedAt) {
    return totalSeconds;
  }

  const millisecondsUntilEnd = startedAt + totalSeconds * 1000 - now;
  return Math.max(0, Math.ceil(millisecondsUntilEnd / 1000));
};
