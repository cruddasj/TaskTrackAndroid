export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const getTodayKey = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const normalizeOptionalDescription = (description: string): string => {
  return description.trim();
};
