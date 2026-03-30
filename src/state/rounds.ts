import { Round, Task } from '../types';

export const hasEmptyRoundWithoutTasks = (rounds: Round[]): boolean =>
  rounds.some((round) => round.status !== 'done' && round.taskIds.length === 0);
export const isRoundCompleted = (round?: Round): boolean => round?.status === 'done';

export const hasRoundsWithAssignedTasks = (rounds: Round[]): boolean => rounds.some((round) => round.taskIds.length > 0);

export const getRoundEstimatedMinutes = (round: Round, tasks: Task[]): number =>
  round.taskIds.reduce((total, taskId) => {
    const task = tasks.find((candidate) => candidate.id === taskId);
    return total + (task?.estimateMinutes ?? 0);
  }, 0);

export const getRoundTaskIdsForDisplay = (round: Round, tasks: Task[]): string[] => {
  const displayTaskIds = new Set(round.taskIds);
  tasks.forEach((task) => {
    if (task.previousRoundIds?.includes(round.id)) {
      displayTaskIds.add(task.id);
    }
  });
  return [...displayTaskIds];
};


type CarryHistory = {
  carriedFromRoundId?: string;
  carriedToRoundId?: string;
};

export const getCarryHistoryForRound = (task: Task, roundId: string): CarryHistory => {
  const history = task.previousRoundIds ?? [];
  const displayedRoundIndex = history.indexOf(roundId);

  if (displayedRoundIndex < 0) {
    return {};
  }

  const carriedFromRoundId = displayedRoundIndex > 0 ? history[displayedRoundIndex - 1] : undefined;
  const carriedToRoundId = history[displayedRoundIndex + 1] ?? task.roundId;

  return { carriedFromRoundId, carriedToRoundId };
};

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

const getRoundTitleSequence = (title: string): number | undefined => {
  const matched = /^Round (\d+)\b/.exec(title.trim());
  if (!matched) return undefined;
  const sequence = Number(matched[1]);
  return Number.isFinite(sequence) ? sequence : undefined;
};

export const sortRoundsChronologically = (rounds: Round[]): Round[] =>
  rounds
    .map((round, index) => ({ round, index }))
    .sort((left, right) => {
      const leftSequence = getRoundTitleSequence(left.round.title);
      const rightSequence = getRoundTitleSequence(right.round.title);

      if (leftSequence !== undefined && rightSequence !== undefined && leftSequence !== rightSequence) {
        return leftSequence - rightSequence;
      }
      if (leftSequence !== undefined && rightSequence === undefined) return -1;
      if (leftSequence === undefined && rightSequence !== undefined) return 1;

      return left.index - right.index;
    })
    .map(({ round }) => round);

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

  const currentRound = openRounds.find((round) => round.id === currentRoundId) ?? openRounds[0];
  const currentIndex = openRounds.findIndex((round) => round.id === currentRound.id);
  const nextRound = currentIndex < openRounds.length - 1 ? openRounds[currentIndex + 1] : undefined;

  return {
    nextRoundId: nextRound?.id,
    rounds: rounds.map((round) => {
      if (round.status === 'done') return round;
      if (round.id === currentRound.id) return { ...round, status: 'done' };
      return { ...round, status: round.id === nextRound?.id ? 'active' : 'upcoming' };
    }),
  };
};

export const getCarryForwardRound = (rounds: Round[], currentRoundId: string): Round | undefined => {
  const openRounds = rounds.filter((round) => round.status !== 'done');
  const currentRoundIndex = openRounds.findIndex((round) => round.id === currentRoundId);
  if (currentRoundIndex < 0) {
    return openRounds.find((round) => round.id !== currentRoundId);
  }

  return openRounds[currentRoundIndex + 1];
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
