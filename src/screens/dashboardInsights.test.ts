import { getCategoryTotals, getCompletedTaskHistory } from './dashboardInsights';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-02T12:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getCompletedTaskHistory', () => {
  it('groups completed tasks by day in most-recent-first order', () => {
    const history = getCompletedTaskHistory(
      [
        {
          id: 't1',
          title: 'Write summary',
          description: '',
          category: 'Work',
          estimateMinutes: 20,
          status: 'done',
          plannedDate: '2026-03-29',
          completedAt: '2026-03-31T09:10:00.000Z',
        },
        {
          id: 't2',
          title: 'Clear inbox',
          description: '',
          category: 'Admin',
          estimateMinutes: 10,
          status: 'done',
          plannedDate: '2026-03-29',
          completedAt: '2026-03-30T11:00:00.000Z',
        },
      ],
      30,
    );

    expect(history[0]?.dayKey).toBe('2026-03-31');
    expect(history[0]?.tasks.map((task) => task.title)).toEqual(['Write summary']);
    expect(history[1]?.dayKey).toBe('2026-03-30');
    expect(history[1]?.tasks.map((task) => task.title)).toEqual(['Clear inbox']);
  });

  it('falls back to planned date for done tasks without completedAt values', () => {
    const history = getCompletedTaskHistory(
      [
        {
          id: 't1',
          title: 'Legacy completed task',
          description: '',
          category: 'General',
          estimateMinutes: 25,
          status: 'done',
          plannedDate: '2026-03-28',
        },
      ],
      30,
    );

    expect(history.some((entry) => entry.dayKey === '2026-03-28')).toBe(true);
  });
});

describe('getCategoryTotals', () => {
  it('sums category totals only for tasks completed inside the history window', () => {
    const totals = getCategoryTotals(
      [
        {
          id: 't1',
          title: 'Task A',
          description: '',
          category: 'Work',
          estimateMinutes: 30,
          status: 'done',
          plannedDate: '2026-03-30',
          completedAt: '2026-03-30T09:10:00.000Z',
        },
        {
          id: 't2',
          title: 'Task B',
          description: '',
          category: 'Work',
          estimateMinutes: 20,
          status: 'done',
          plannedDate: '2026-02-01',
          completedAt: '2026-02-01T09:10:00.000Z',
        },
      ],
      30,
    );

    expect(totals).toEqual({ Work: 30 });
  });
});
