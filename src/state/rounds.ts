import { Round, RoundPlacementPreference, Task } from '../types';
import { getTodayKey } from '../utils';

export const getRoundPlannedDate = (round: Round): string => round.plannedDate ?? getTodayKey();

export const hasEmptyRoundWithoutTasks = (rounds: Round[]): boolean =>
  rounds.some((round) => round.status !== 'done' && round.taskIds.length === 0);
export const isRoundCompleted = (round?: Round): boolean => round?.status === 'done';

export const hasRoundsWithAssignedTasks = (rounds: Round[], plannedDate = getTodayKey()): boolean =>
  rounds.some((round) => getRoundPlannedDate(round) === plannedDate && round.taskIds.length > 0);

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
  return Array.from(displayTaskIds);
};

export const moveTaskInRound = (taskIds: string[], taskId: string, direction: 'up' | 'down'): string[] => {
  const currentIndex = taskIds.indexOf(taskId);
  if (currentIndex < 0) return taskIds;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= taskIds.length) return taskIds;

  const nextTaskIds = [...taskIds];
  const [movingTaskId] = nextTaskIds.splice(currentIndex, 1);
  nextTaskIds.splice(targetIndex, 0, movingTaskId);
  return nextTaskIds;
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

export const getHighestRoundSequence = (rounds: Round[], plannedDate?: string): number => {
  const numberedRoundValues = rounds
    .filter((round) => !plannedDate || getRoundPlannedDate(round) === plannedDate)
    .map((round) => {
      const matched = /^Round (\d+)$/.exec(round.title.trim());
      return matched ? Number(matched[1]) : 0;
    })
    .filter((value) => Number.isFinite(value) && value > 0);
  return numberedRoundValues.length > 0 ? Math.max(...numberedRoundValues) : 0;
};

const getNextRoundSequence = (rounds: Round[], plannedDate?: string): number => getHighestRoundSequence(rounds, plannedDate) + 1;

export const getDefaultRoundTitle = (rounds: Round[], plannedDate?: string): string => `Round ${getNextRoundSequence(rounds, plannedDate)}`;

export const normalizeRoundTitlesForDate = (rounds: Round[], plannedDate: string): Round[] => {
  let sequence = 0;
  return rounds.map((round) => {
    if (getRoundPlannedDate(round) !== plannedDate) {
      return round;
    }

    sequence += 1;
    return { ...round, title: `Round ${sequence}` };
  });
};

const getRoundTitleSequence = (title: string): number | undefined => {
  const matched = /^Round (\d+)\b/.exec(title.trim());
  if (!matched) return undefined;
  const sequence = parseInt(matched[1], 10);
  return Number.isNaN(sequence) ? undefined : sequence;
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
  options?: { title?: string; taskIds?: string[]; plannedDate?: string },
): Round => ({
  id: crypto.randomUUID(),
  title: options?.title?.trim() || getDefaultRoundTitle(rounds, options?.plannedDate),
  plannedDate: options?.plannedDate ?? getTodayKey(),
  scheduledTime: '',
  durationMinutes: pomodoroMinutes,
  taskIds: options?.taskIds ?? [],
  status: rounds.some((round) => round.status !== 'done') ? 'upcoming' : 'active',
});

export const removeRoundAndNormalizeStatuses = (rounds: Round[], roundId: string): Round[] => {
  const removedRound = rounds.find((round) => round.id === roundId);
  const removedRoundDate = removedRound ? getRoundPlannedDate(removedRound) : undefined;
  const remainingRounds = rounds.filter((round) => round.id !== roundId);
  const firstOpenRoundId = remainingRounds.find((round) =>
    round.status !== 'done' && getRoundPlannedDate(round) === removedRoundDate)?.id;
  return remainingRounds.map((round) =>
    round.status === 'done' || getRoundPlannedDate(round) !== removedRoundDate
      ? round
      : { ...round, status: round.id === firstOpenRoundId ? 'active' : 'upcoming' },
  );
};

export const unassignTasksFromRound = (tasks: Task[], roundId: string): Task[] =>
  tasks.map((task) => (task.roundId === roundId ? { ...task, roundId: undefined } : task));

export const isRoundLockedByActivePomodoro = (roundId: string, activeRoundId?: string): boolean =>
  roundId === activeRoundId;

export const canDeleteRound = (
  round: Round,
  activeRoundId: string | undefined,
  debugModeEnabled: boolean,
): boolean => {
  if (isRoundLockedByActivePomodoro(round.id, activeRoundId)) {
    return false;
  }
  if (round.status === 'done') {
    return debugModeEnabled;
  }
  return true;
};

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


type RoundGroupingTask = Pick<Task, 'id' | 'title' | 'category' | 'estimateMinutes' | 'roundPlacementPreference'>;
type RoundGroupingTaskBankItem = Pick<Task, 'title' | 'category' | 'roundPlacementPreference'>;

const getPreferencePriority = (preference?: RoundPlacementPreference): number => {
  if (preference === 'early') return 0;
  if (preference === 'late') return 2;
  return 1;
};

const normalizeGroupPreferenceKey = (value: string): string => value.trim().toLocaleLowerCase();

const getTaskPreferenceOverrideMap = (
  tasks: RoundGroupingTask[],
  taskBank: RoundGroupingTaskBankItem[],
): Map<string, RoundPlacementPreference | undefined> => {
  const preferenceByTitleAndCategory = new Map<string, RoundPlacementPreference | undefined>();
  taskBank.forEach((item) => {
    const key = `${normalizeGroupPreferenceKey(item.title)}::${normalizeGroupPreferenceKey(item.category)}`;
    preferenceByTitleAndCategory.set(key, item.roundPlacementPreference);
  });

  const preferenceByTaskId = new Map<string, RoundPlacementPreference | undefined>();
  tasks.forEach((task) => {
    const key = `${normalizeGroupPreferenceKey(task.title)}::${normalizeGroupPreferenceKey(task.category)}`;
    if (!preferenceByTitleAndCategory.has(key)) return;
    preferenceByTaskId.set(task.id, preferenceByTitleAndCategory.get(key));
  });
  return preferenceByTaskId;
};

const sortTasksForAutoGrouping = (
  tasks: RoundGroupingTask[],
  preferenceOverrideByTaskId: Map<string, RoundPlacementPreference | undefined>,
): RoundGroupingTask[] =>
  [...tasks].sort((left, right) => {
    const leftPreference = preferenceOverrideByTaskId.get(left.id) ?? left.roundPlacementPreference;
    const rightPreference = preferenceOverrideByTaskId.get(right.id) ?? right.roundPlacementPreference;
    const preferenceOrder = getPreferencePriority(leftPreference) - getPreferencePriority(rightPreference);
    if (preferenceOrder !== 0) return preferenceOrder;
    if (left.category !== right.category) {
      return left.category.localeCompare(right.category, undefined, { sensitivity: 'base' });
    }
    return left.id.localeCompare(right.id, undefined, { sensitivity: 'base' });
  });

export const buildAutoRoundTaskGroups = (
  tasks: RoundGroupingTask[],
  pomodoroLimit: number,
  taskBank: RoundGroupingTaskBankItem[] = [],
): string[][] => {
  if (pomodoroLimit <= 0) return [];

  const preferenceOverrideByTaskId = getTaskPreferenceOverrideMap(tasks, taskBank);
  const sortedTasks = sortTasksForAutoGrouping(tasks, preferenceOverrideByTaskId);
  const groupedTaskIds: string[][] = [];
  let currentGroup: string[] = [];
  let currentMinutes = 0;
  let previousCategory: string | undefined;

  sortedTasks.forEach((task) => {
    const startsNewCategory = Boolean(currentGroup.length > 0 && previousCategory && previousCategory !== task.category);
    const wouldExceedLimit = currentGroup.length > 0 && currentMinutes + task.estimateMinutes > pomodoroLimit;

    if (startsNewCategory || wouldExceedLimit) {
      groupedTaskIds.push(currentGroup);
      currentGroup = [];
      currentMinutes = 0;
    }

    currentGroup.push(task.id);
    currentMinutes += task.estimateMinutes;
    previousCategory = task.category;
  });

  if (currentGroup.length > 0) groupedTaskIds.push(currentGroup);

  return groupedTaskIds;
};
