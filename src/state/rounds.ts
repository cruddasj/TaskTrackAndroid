import { Round, Task } from '../types';

export const hasEmptyRoundWithoutTasks = (rounds: Round[]): boolean => rounds.some((round) => round.taskIds.length === 0);

export const hasRoundsWithAssignedTasks = (rounds: Round[]): boolean => rounds.some((round) => round.taskIds.length > 0);

export const getRoundEstimatedMinutes = (round: Round, tasks: Task[]): number =>
  round.taskIds.reduce((total, taskId) => {
    const task = tasks.find((candidate) => candidate.id === taskId);
    return total + (task?.estimateMinutes ?? 0);
  }, 0);

const getNextRoundSequence = (rounds: Round[]): number => {
  const numberedRoundValues = rounds
    .map((round) => {
      const matched = /^Round (\d+)$/.exec(round.title.trim());
      return matched ? Number(matched[1]) : 0;
    })
    .filter((value) => Number.isFinite(value) && value > 0);
  const highestNamedRound = numberedRoundValues.length > 0 ? Math.max(...numberedRoundValues) : 0;
  return Math.max(rounds.length, highestNamedRound) + 1;
};

export const getDefaultRoundTitle = (rounds: Round[]): string => `Round ${getNextRoundSequence(rounds)}`;

export const buildNewRound = (
  rounds: Round[],
  pomodoroMinutes: number,
  options?: { title?: string; taskIds?: string[] },
): Round => ({
  id: crypto.randomUUID(),
  title: options?.title?.trim() || getDefaultRoundTitle(rounds),
  scheduledTime: '',
  durationMinutes: pomodoroMinutes,
  taskIds: options?.taskIds ?? [],
  status: rounds.some((round) => round.status !== 'done') ? 'upcoming' : 'active',
});

export const removeRoundAndNormalizeStatuses = (rounds: Round[], roundId: string): Round[] => {
  const remainingRounds = rounds.filter((round) => round.id !== roundId);
  const firstOpenRoundId = remainingRounds.find((round) => round.status !== 'done')?.id;
  return remainingRounds.map((round) =>
    round.status === 'done'
      ? round
      : { ...round, status: round.id === firstOpenRoundId ? 'active' : 'upcoming' },
  );
};

export const unassignTasksFromRound = (tasks: Task[], roundId: string): Task[] =>
  tasks.map((task) => (task.roundId === roundId ? { ...task, roundId: undefined } : task));

export const advanceActiveRound = (rounds: Round[], currentRoundId?: string): { rounds: Round[]; nextRoundId?: string } => {
  const openRounds = rounds.filter((round) => round.status !== 'done');
  if (openRounds.length === 0) {
    return { rounds, nextRoundId: undefined };
  }

  const currentIndex = openRounds.findIndex((round) => round.id === currentRoundId);
  const nextRound =
    currentIndex >= 0 && currentIndex < openRounds.length - 1
      ? openRounds[currentIndex + 1]
      : currentIndex >= 0
        ? openRounds[currentIndex]
        : openRounds[0];

  return {
    nextRoundId: nextRound.id,
    rounds: rounds.map((round) =>
      round.status === 'done' ? round : { ...round, status: round.id === nextRound.id ? 'active' : 'upcoming' },
    ),
  };
};

export const getVisibleRoundId = (
  rounds: Round[],
  requestedRoundId?: string,
  activeRoundId?: string,
): string | undefined => {
  const roundIds = new Set(rounds.map((round) => round.id));
  if (activeRoundId && roundIds.has(activeRoundId)) {
    return activeRoundId;
  }
  if (requestedRoundId && roundIds.has(requestedRoundId)) {
    return requestedRoundId;
  }
  return rounds.find((round) => round.status === 'active')?.id;
};
