import { getWorkSkipOutcome, shouldPromptRoundCompletion } from './focusSkip';

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

describe('shouldPromptRoundCompletion', () => {
  it('returns true when active work round tasks are all done and time remains', () => {
    expect(
      shouldPromptRoundCompletion({
        isWorkPhase: true,
        hasActivePomodoroRound: true,
        hasRoundTasks: true,
        unfinishedRoundTaskCount: 0,
        remainingSeconds: 120,
      }),
    ).toBe(true);
  });

  it('returns false when timer is already finished', () => {
    expect(
      shouldPromptRoundCompletion({
        isWorkPhase: true,
        hasActivePomodoroRound: true,
        hasRoundTasks: true,
        unfinishedRoundTaskCount: 0,
        remainingSeconds: 0,
      }),
    ).toBe(false);
  });

  it('returns false when any completion precondition is missing', () => {
    expect(
      shouldPromptRoundCompletion({
        isWorkPhase: false,
        hasActivePomodoroRound: true,
        hasRoundTasks: true,
        unfinishedRoundTaskCount: 0,
        remainingSeconds: 60,
      }),
    ).toBe(false);
    expect(
      shouldPromptRoundCompletion({
        isWorkPhase: true,
        hasActivePomodoroRound: false,
        hasRoundTasks: true,
        unfinishedRoundTaskCount: 0,
        remainingSeconds: 60,
      }),
    ).toBe(false);
    expect(
      shouldPromptRoundCompletion({
        isWorkPhase: true,
        hasActivePomodoroRound: true,
        hasRoundTasks: false,
        unfinishedRoundTaskCount: 0,
        remainingSeconds: 60,
      }),
    ).toBe(false);
    expect(
      shouldPromptRoundCompletion({
        isWorkPhase: true,
        hasActivePomodoroRound: true,
        hasRoundTasks: true,
        unfinishedRoundTaskCount: 1,
        remainingSeconds: 60,
      }),
    ).toBe(false);
  });
});
