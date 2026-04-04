import { advanceActiveRound, buildNewRound, getCarryForwardRound, getCarryHistoryForRound, getDefaultRoundTitle, getHighestRoundSequence, getRoundEstimatedMinutes, getRoundTaskIdsForDisplay, getVisibleRoundId, hasEmptyRoundWithoutTasks, hasRoundsWithAssignedTasks, isRoundCompleted, moveTaskInRound, removeRoundAndNormalizeStatuses, sortRoundsChronologically, unassignTasksFromRound } from './rounds';

describe('round helpers', () => {
  it('detects when a round has no tasks assigned', () => {
    expect(
      hasEmptyRoundWithoutTasks([
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'upcoming' },
      ]),
    ).toBe(true);
  });

  it('ignores empty rounds that are completed and locked', () => {
    expect(
      hasEmptyRoundWithoutTasks([
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'done' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'active' },
      ]),
    ).toBe(false);
  });

  it('recognizes completed rounds for assignment guards', () => {
    expect(isRoundCompleted({ id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'done' })).toBe(true);
    expect(isRoundCompleted({ id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'active' })).toBe(false);
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

  it('uses the next sequence number when round names are customized', () => {
    expect(
      getDefaultRoundTitle([
        { id: 'r1', title: 'Round 3', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        { id: 'r2', title: 'Morning', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'upcoming' },
      ]),
    ).toBe('Round 4');
  });

  it('starts default round numbering at 1 when no default round titles exist', () => {
    expect(
      getDefaultRoundTitle([
        { id: 'r1', title: 'Morning Sprint', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        { id: 'r2', title: 'Deep Work', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'upcoming' },
      ]),
    ).toBe('Round 1');
  });

  it('finds the highest titled round number without relying on list order', () => {
    expect(
      getHighestRoundSequence([
        { id: 'r1', title: 'Round 12', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'done' },
        { id: 'r2', title: 'Planning', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'active' },
        { id: 'r3', title: 'Round 7', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'upcoming' },
      ]),
    ).toBe(12);
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

  it('advances to the next open round after a break', () => {
    const result = advanceActiveRound(
      [
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'upcoming' },
        { id: 'r3', title: 'Round 3', scheduledTime: '', durationMinutes: 25, taskIds: ['t3'], status: 'done' },
      ],
      'r1',
    );

    expect(result.nextRoundId).toBe('r2');
    expect(result.rounds.find((round) => round.id === 'r1')?.status).toBe('done');
    expect(result.rounds.find((round) => round.id === 'r2')?.status).toBe('active');
    expect(result.rounds.find((round) => round.id === 'r3')?.status).toBe('done');
  });

  it('marks the final open round as done when no next round exists', () => {
    const result = advanceActiveRound(
      [
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'active' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'done' },
      ],
      'r1',
    );

    expect(result.nextRoundId).toBeUndefined();
    expect(result.rounds.find((round) => round.id === 'r1')?.status).toBe('done');
    expect(result.rounds.find((round) => round.id === 'r2')?.status).toBe('done');
  });

  it('detects when at least one round can be tracked', () => {
    expect(
      hasRoundsWithAssignedTasks([
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'active' },
        { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'upcoming' },
      ]),
    ).toBe(true);
  });

  it('totals estimated task minutes for the round', () => {
    expect(
      getRoundEstimatedMinutes(
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1', 't2'], status: 'active' },
        [
          { id: 't1', title: 'A', description: '', category: 'Work', estimateMinutes: 15, status: 'todo', plannedDate: '2026-03-29', roundId: 'r1' },
          { id: 't2', title: 'B', description: '', category: 'Work', estimateMinutes: 20, status: 'todo', plannedDate: '2026-03-29', roundId: 'r1' },
        ],
      ),
    ).toBe(35);
  });

  it('ignores missing task ids when totaling estimates', () => {
    expect(
      getRoundEstimatedMinutes(
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1', 'missing'], status: 'active' },
        [{ id: 't1', title: 'A', description: '', category: 'Work', estimateMinutes: 10, status: 'todo', plannedDate: '2026-03-29', roundId: 'r1' }],
      ),
    ).toBe(10);
  });

  it('keeps moved tasks visible in their previous completed round', () => {
    expect(
      getRoundTaskIdsForDisplay(
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'done' },
        [
          {
            id: 't1',
            title: 'Review sprint priorities',
            description: '',
            category: 'Work',
            estimateMinutes: 20,
            status: 'todo',
            plannedDate: '2026-03-29',
            roundId: 'r2',
            previousRoundIds: ['r1'],
          },
        ],
      ),
    ).toEqual(['t1']);
  });

  it('does not duplicate task ids when task is both currently and previously linked to a round', () => {
    expect(
      getRoundTaskIdsForDisplay(
        { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'done' },
        [
          {
            id: 't1',
            title: 'Review sprint priorities',
            description: '',
            category: 'Work',
            estimateMinutes: 20,
            status: 'todo',
            plannedDate: '2026-03-29',
            roundId: 'r1',
            previousRoundIds: ['r1'],
          },
        ],
      ),
    ).toEqual(['t1']);
  });

  it('prefers the active pomodoro round over a requested round id', () => {
    expect(
      getVisibleRoundId(
        [
          { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'upcoming' },
          { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'active' },
        ],
        'r1',
        'r2',
      ),
    ).toBe('r2');
  });

  it('falls back to active status round when requested and active ids are missing', () => {
    expect(
      getVisibleRoundId(
        [
          { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'active' },
          { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'upcoming' },
        ],
        'missing',
        'also-missing',
      ),
    ).toBe('r1');
  });

  it('selects the next open round when carrying unfinished tasks forward', () => {
    expect(
      getCarryForwardRound(
        [
          { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'upcoming' },
          { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'active' },
        ],
        'r2',
      )?.id,
    ).toBeUndefined();
  });

  it('does not move unfinished tasks back into an earlier round', () => {
    expect(
      getCarryForwardRound(
        [
          { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: ['t1'], status: 'upcoming' },
          { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'active' },
          { id: 'r3', title: 'Round 3', scheduledTime: '', durationMinutes: 25, taskIds: ['t3'], status: 'upcoming' },
        ],
        'r2',
      )?.id,
    ).toBe('r3');
  });

  it('sorts rounds in numeric round-title order for display', () => {
    const sorted = sortRoundsChronologically([
      { id: 'r3', title: 'Round 3', scheduledTime: '', durationMinutes: 25, taskIds: ['t3'], status: 'active' },
      { id: 'r1', title: 'Round 1', scheduledTime: '', durationMinutes: 25, taskIds: [], status: 'done' },
      { id: 'r2', title: 'Round 2', scheduledTime: '', durationMinutes: 25, taskIds: ['t2'], status: 'done' },
    ]);

    expect(sorted.map((round) => round.title)).toEqual(['Round 1', 'Round 2', 'Round 3']);
  });

  it('maps carry-over history to the immediate prior and next rounds for display', () => {
    expect(
      getCarryHistoryForRound(
        {
          id: 't1',
          title: 'Review sprint priorities',
          description: '',
          category: 'Work',
          estimateMinutes: 20,
          status: 'todo',
          plannedDate: '2026-03-29',
          roundId: 'r4',
          previousRoundIds: ['r1', 'r2', 'r3'],
        },
        'r2',
      ),
    ).toEqual({ carriedFromRoundId: 'r1', carriedToRoundId: 'r3' });
  });

  it('keeps first carry-over copy focused on the next round only', () => {
    expect(
      getCarryHistoryForRound(
        {
          id: 't1',
          title: 'Review sprint priorities',
          description: '',
          category: 'Work',
          estimateMinutes: 20,
          status: 'todo',
          plannedDate: '2026-03-29',
          roundId: 'r2',
          previousRoundIds: ['r1'],
        },
        'r1',
      ),
    ).toEqual({ carriedFromRoundId: undefined, carriedToRoundId: 'r2' });
  });

  it('moves a round task up when a prior task exists', () => {
    expect(moveTaskInRound(['t1', 't2', 't3'], 't2', 'up')).toEqual(['t2', 't1', 't3']);
  });

  it('moves a round task down when a next task exists', () => {
    expect(moveTaskInRound(['t1', 't2', 't3'], 't2', 'down')).toEqual(['t1', 't3', 't2']);
  });

  it('keeps task order unchanged when movement is out of bounds', () => {
    expect(moveTaskInRound(['t1', 't2'], 't1', 'up')).toEqual(['t1', 't2']);
    expect(moveTaskInRound(['t1', 't2'], 't2', 'down')).toEqual(['t1', 't2']);
  });

});
