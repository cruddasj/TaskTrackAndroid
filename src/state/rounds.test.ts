import { buildNewRound, hasEmptyRoundWithoutTasks, removeRoundAndNormalizeStatuses, unassignTasksFromRound } from './rounds';

describe('round helpers', () => {
  it('detects when a round has no tasks assigned', () => {
    expect(
      hasEmptyRoundWithoutTasks([
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'upcoming' },
      ]),
    ).toBe(true);
  });

  it('creates upcoming rounds while an unfinished round exists', () => {
    const round = buildNewRound(
      [{ id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' }],
      25,
    );

    expect(round.title).toBe('Round 2');
    expect(round.durationMinutes).toBe(25);
    expect(round.status).toBe('upcoming');
  });

  it('creates an active round when all existing rounds are done', () => {
    const round = buildNewRound(
      [{ id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'done' }],
      30,
    );

    expect(round.status).toBe('active');
    expect(round.durationMinutes).toBe(30);
  });

  it('removes a round and keeps the first open round active', () => {
    const rounds = removeRoundAndNormalizeStatuses(
      [
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'upcoming' },
      ],
      'r1',
    );

    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({ id: 'r2', status: 'active' });
  });

  it('unassigns only tasks from a deleted round', () => {
    const tasks = unassignTasksFromRound(
      [
        { id: 't1', title: 'A', description: '', category: 'Work', estimateMinutes: 25, status: 'todo', plannedDate: '2026-03-29', roundId: 'r1' },
        { id: 't2', title: 'B', description: '', category: 'Work', estimateMinutes: 25, status: 'todo', plannedDate: '2026-03-29', roundId: 'r2' },
      ],
      'r1',
    );

    expect(tasks[0].roundId).toBeUndefined();
    expect(tasks[1].roundId).toBe('r2');
  });
});
