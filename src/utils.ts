export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const getTodayKey = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const getDateKeyWithOffset = (daysFromToday: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
};

export const getTomorrowKey = (): string => getDateKeyWithOffset(1);

export const formatRemainingEndTime = (remainingSeconds: number, now: Date = new Date()): string => {
  const clampedSeconds = Math.max(remainingSeconds, 0);
  const endTime = new Date(now.getTime() + clampedSeconds * 1000);

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(endTime);
};

export const normalizeOptionalDescription = (description: string): string => {
  return description.trim();
};
