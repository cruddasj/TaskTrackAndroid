export const getGreeting = (hour: number): string => {
  if (hour >= 6 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 19) return 'Good afternoon';
  return 'Good evening';
};

export const formatFocusTimeSpent = (totalFocusMinutes: number): string => {
  if (totalFocusMinutes < 60) {
    return `${totalFocusMinutes}m`;
  }

  const hours = Math.floor(totalFocusMinutes / 60);
  const minutes = totalFocusMinutes % 60;
  return `${hours}h ${minutes}m`;
};
