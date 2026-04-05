import { getTaskPrimaryActionLabel, getTaskSecondaryActionLabel, shouldShowDoneHeading, shouldShowTodoSection } from './todaysTasksActions';
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

describe('getTaskSecondaryActionLabel', () => {
  it('returns move-to-tomorrow action only for today tasks', () => {
    expect(getTaskSecondaryActionLabel('today')).toBe('Move to tomorrow');
    expect(getTaskSecondaryActionLabel('tomorrow')).toBeNull();
  });
});


describe('shouldShowTodoSection', () => {
  it('hides to-do section when there are no to-do tasks', () => {
    expect(shouldShowTodoSection(0)).toBe(false);
  });

  it('shows to-do section when at least one to-do task remains', () => {
    expect(shouldShowTodoSection(1)).toBe(true);
  });
});

describe('shouldShowDoneHeading', () => {
  it('hides done heading when there are no done tasks', () => {
    expect(shouldShowDoneHeading('today', 0)).toBe(false);
    expect(shouldShowDoneHeading('tomorrow', 0)).toBe(false);
  });

  it('shows done heading for today and tomorrow with done tasks', () => {
    expect(shouldShowDoneHeading('today', 1)).toBe(true);
    expect(shouldShowDoneHeading('tomorrow', 1)).toBe(true);
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
