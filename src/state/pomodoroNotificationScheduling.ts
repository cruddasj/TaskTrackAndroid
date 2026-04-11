export const getStalePomodoroSessionId = (
  previousSessionId: number | null,
  currentSessionId: number | null,
): number | undefined => {
  if (!previousSessionId || previousSessionId === currentSessionId) {
    return undefined;
  }
  return previousSessionId;
};
