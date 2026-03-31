import { getWorkSkipOutcome } from './focusSkip';

describe('getWorkSkipOutcome', () => {
  it('advances round and exits timer when all today tasks are done', () => {
    expect(getWorkSkipOutcome({ allTodaysTasksDone: true, unfinishedRoundTaskCount: 0 })).toBe('advance_then_reset');
  });

  it('advances round when current round is fully done but other tasks remain today', () => {
    expect(getWorkSkipOutcome({ allTodaysTasksDone: false, unfinishedRoundTaskCount: 0 })).toBe('advance_only');
  });

  it('opens session review when unfinished tasks remain in the round', () => {
    expect(getWorkSkipOutcome({ allTodaysTasksDone: true, unfinishedRoundTaskCount: 1 })).toBe('open_review');
  });
});
