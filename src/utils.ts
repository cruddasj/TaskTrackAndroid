export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKey = (baseDate: Date = new Date()): string => formatDateKey(baseDate);

export const getDateKeyWithOffset = (daysFromToday: number, baseDate: Date = new Date()): string => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysFromToday);
  return formatDateKey(date);
};

export const getTomorrowKey = (baseDate: Date = new Date()): string => getDateKeyWithOffset(1, baseDate);

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatRemainingEndTime = (remainingSeconds: number, now: Date = new Date()): string => {
  const clampedSeconds = Math.max(remainingSeconds, 0);
  const endTime = new Date(now.getTime() + clampedSeconds * 1000);

  return timeFormat.format(endTime);
};

export const normalizeOptionalDescription = (description: string): string => {
  return description.trim();
};
