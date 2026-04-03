import { Round, Task } from '../types';

export const appendUniqueRoundId = (previousRoundIds: string[] | undefined, roundId: string): string[] => {
  const history = previousRoundIds ?? [];
  return history.includes(roundId) ? history : [...history, roundId];
};

export const getRevivedTaskRoundUpdate = (task: Task, rounds: Round[]): Pick<Task, 'roundId' | 'previousRoundIds'> => {
  const currentRoundId = task.roundId;
  const currentRound = currentRoundId ? rounds.find((round) => round.id === currentRoundId) : undefined;
  const shouldUnassignFromDoneRound = currentRound?.status === 'done';

  if (!shouldUnassignFromDoneRound || !currentRoundId) {
    return {
      roundId: task.roundId,
      previousRoundIds: task.previousRoundIds,
    };
  }

  return {
    roundId: undefined,
    previousRoundIds: appendUniqueRoundId(task.previousRoundIds, currentRoundId),
  };
};

export const getAssignmentRoundUpdate = (
  task: Task,
  targetRoundId: string,
  shouldAssignToTargetRound: boolean,
): Pick<Task, 'roundId' | 'previousRoundIds'> => {
  if (shouldAssignToTargetRound) {
    const currentRoundId = task.roundId;
    const wasInDifferentRound = typeof currentRoundId === 'string' && currentRoundId !== targetRoundId;
    return {
      roundId: targetRoundId,
      previousRoundIds: wasInDifferentRound && currentRoundId
        ? appendUniqueRoundId(task.previousRoundIds, currentRoundId)
        : task.previousRoundIds,
    };
  }

  if (task.roundId === targetRoundId) {
    return { roundId: undefined, previousRoundIds: task.previousRoundIds };
  }

  return { roundId: task.roundId, previousRoundIds: task.previousRoundIds };
};
