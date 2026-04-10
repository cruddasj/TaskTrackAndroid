export type WorkSkipOutcome = 'open_review' | 'advance_only' | 'advance_then_reset';

export const getWorkSkipOutcome = (options: {
  allTodaysTasksDone: boolean;
  unfinishedRoundTaskCount: number;
}): WorkSkipOutcome => {
  const { allTodaysTasksDone, unfinishedRoundTaskCount } = options;

  if (unfinishedRoundTaskCount === 0) {
    return allTodaysTasksDone ? 'advance_then_reset' : 'advance_only';
  }

  return 'open_review';
};

export const shouldPromptRoundCompletion = (options: {
  isWorkPhase: boolean;
  hasActivePomodoroRound: boolean;
  hasRoundTasks: boolean;
  unfinishedRoundTaskCount: number;
  remainingSeconds: number;
}): boolean => {
  const {
    isWorkPhase,
    hasActivePomodoroRound,
    hasRoundTasks,
    unfinishedRoundTaskCount,
    remainingSeconds,
  } = options;

  return isWorkPhase
    && hasActivePomodoroRound
    && hasRoundTasks
    && unfinishedRoundTaskCount === 0
    && remainingSeconds > 0;
};
