export const getGreeting = (hour: number): string => {
  if (hour >= 6 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 19) return 'Good afternoon';
  return 'Good evening';
};
