import { formatFocusTimeSpent, getGreeting } from './greeting';
import { getDashboardHeroCopy, getTodayRoundMetrics } from './dashboardMetrics';

describe('getGreeting', () => {
  it('returns afternoon at 6pm', () => {
    expect(getGreeting(18)).toBe('Good afternoon');
  });

  it('returns evening at 7pm', () => {
    expect(getGreeting(19)).toBe('Good evening');
  });
});

describe('formatFocusTimeSpent', () => {
  it('returns only minutes when less than an hour has passed', () => {
    expect(formatFocusTimeSpent(45)).toBe('45m');
  });

  it('returns hours and minutes when at least an hour has passed', () => {
    expect(formatFocusTimeSpent(100)).toBe('1h 40m');
  });
});

describe('getTodayRoundMetrics', () => {
  it('counts only completed rounds tied to today tasks', () => {
    const metrics = getTodayRoundMetrics(
      [
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'done' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 5, taskIds: [], status: 'done' },
        { id: 'r3', title: 'Round 3', scheduledTime: '', durationMinutes: 25, taskIds: ['t3'], status: 'active' },
      ],
      [
        { id: 't1', title: 'Task 1', description: '', category: 'General', estimateMinutes: 25, status: 'done', plannedDate: '2026-03-31' },
        { id: 't2', title: 'Task 2', description: '', category: 'General', estimateMinutes: 15, status: 'todo', plannedDate: '2026-03-31' },
      ],
    );

    expect(metrics).toEqual({ completedRounds: 1, focusedMinutes: 25 });
  });

  it('counts completed rounds that only have carried-over today tasks in history', () => {
    const metrics = getTodayRoundMetrics(
      [
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'done' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t1', 't2'], status: 'done' },
      ],
      [
        {
          id: 't1',
          title: 'Task 1',
          description: '',
          category: 'General',
          estimateMinutes: 25,
          status: 'done',
          plannedDate: '2026-03-31',
          roundId: 'r2',
          previousRoundIds: ['r1'],
        },
        {
          id: 't2',
          title: 'Task 2',
          description: '',
          category: 'General',
          estimateMinutes: 15,
          status: 'done',
          plannedDate: '2026-03-31',
          roundId: 'r2',
        },
      ],
    );

    expect(metrics).toEqual({ completedRounds: 2, focusedMinutes: 50 });
  });
});

describe('getDashboardHeroCopy', () => {
  it('prioritizes all tasks complete copy even during break phases', () => {
    const heroCopy = getDashboardHeroCopy({
      phase: 'short_break',
      allTodaysTasksDone: true,
      currentRoundTaskCount: 0,
    });

    expect(heroCopy).toEqual({
      overline: 'All tasks complete',
      title: 'All today\'s tasks are complete',
    });
  });

  it('shows break copy when tasks are not complete and a break is in progress', () => {
    const heroCopy = getDashboardHeroCopy({
      phase: 'long_break',
      allTodaysTasksDone: false,
      currentRoundTaskCount: 2,
    });

    expect(heroCopy).toEqual({
      overline: 'Break in progress',
      title: 'Break in progress',
    });
  });
});
