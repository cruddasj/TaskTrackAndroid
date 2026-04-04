import { getTaskPrimaryActionLabel } from './todaysTasksActions';

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
