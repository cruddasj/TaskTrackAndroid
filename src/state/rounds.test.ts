import { buildNewRound, hasEmptyRoundWithoutTasks } from './rounds';

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
});
