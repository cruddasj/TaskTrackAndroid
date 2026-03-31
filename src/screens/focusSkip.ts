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
