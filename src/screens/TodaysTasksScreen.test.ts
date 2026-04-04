import { getTaskPrimaryActionLabel } from './todaysTasksActions';
import { getPlanningDayFromQuery } from './planningDayQuery';

describe('getTaskPrimaryActionLabel', () => {
  it('returns move action for tomorrow tasks', () => {
    expect(getTaskPrimaryActionLabel('tomorrow', 'todo')).toBe('Move to today');
    expect(getTaskPrimaryActionLabel('tomorrow', 'done')).toBe('Move to today');
  });

  it('returns done toggle copy for today tasks', () => {
    expect(getTaskPrimaryActionLabel('today', 'todo')).toBe('Mark as done');
    expect(getTaskPrimaryActionLabel('today', 'done')).toBe('Mark as to-do');
  });
});

describe('getPlanningDayFromQuery', () => {
  it('returns tomorrow when query day is tomorrow', () => {
    expect(getPlanningDayFromQuery('tomorrow')).toBe('tomorrow');
  });

  it('defaults to today for missing or unknown query values', () => {
    expect(getPlanningDayFromQuery(null)).toBe('today');
    expect(getPlanningDayFromQuery('today')).toBe('today');
    expect(getPlanningDayFromQuery('next')).toBe('today');
  });
});
