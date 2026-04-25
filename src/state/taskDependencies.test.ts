import { canSaveTaskBankItemWithoutCycle, getTaskBankCyclePath, mapTaskBankPrerequisiteIdsToTaskIds, normalizeDependencyIds } from './taskDependencies';

describe('task dependency helpers', () => {
  it('normalizes dependency ids by trimming and deduplicating valid string ids', () => {
    expect(normalizeDependencyIds([' task-1 ', 'task-1', '', 1, null])).toEqual(['task-1']);
    expect(normalizeDependencyIds('task-1')).toBeUndefined();
  });

  it('prevents saving a task bank item when prerequisites would create a cycle', () => {
    const existing = [
      { id: 'a', prerequisiteTaskBankItemIds: ['b'] },
      { id: 'b', prerequisiteTaskBankItemIds: [] },
    ];

    expect(canSaveTaskBankItemWithoutCycle(existing, { id: 'b', prerequisiteTaskBankItemIds: ['a'] })).toBe(false);
    expect(getTaskBankCyclePath([
      { id: 'a', prerequisiteTaskBankItemIds: ['b'] },
      { id: 'b', prerequisiteTaskBankItemIds: ['a'] },
    ])).toEqual(['a', 'b', 'a']);
  });

  it('maps prerequisite bank ids to planned-day task ids deterministically', () => {
    const mapped = mapTaskBankPrerequisiteIdsToTaskIds(
      { id: 'bank-3', prerequisiteTaskBankItemIds: ['bank-1', 'missing', 'bank-2'] },
      [
        { id: 'task-11', sourceTaskBankItemId: 'bank-1' },
        { id: 'task-12', sourceTaskBankItemId: 'bank-2' },
      ],
    );

    expect(mapped).toEqual(['task-11', 'task-12']);
  });

  it('returns undefined when no prerequisite tasks are planned for that day', () => {
    expect(
      mapTaskBankPrerequisiteIdsToTaskIds(
        { id: 'bank-3', prerequisiteTaskBankItemIds: ['bank-1'] },
        [],
      ),
    ).toBeUndefined();
  });
});
