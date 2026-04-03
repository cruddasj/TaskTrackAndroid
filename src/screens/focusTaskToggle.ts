export const canMarkTaskDone = (isRunning: boolean): boolean => isRunning;

export const getMarkTaskDoneBlockedMessage = (isRunning: boolean): string | null =>
  canMarkTaskDone(isRunning) ? null : 'Start or resume the timer to mark tasks as done.';
