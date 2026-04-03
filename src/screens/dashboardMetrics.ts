import { Round, Task } from '../types';

export interface TodayRoundMetrics {
  completedRounds: number;
  focusedMinutes: number;
}

export const getTodayRoundMetrics = (rounds: Round[], todaysTasks: Task[]): TodayRoundMetrics => {
  const todaysTaskIds = new Set(todaysTasks.map((task) => task.id));
  const roundIdsReferencedByTodayTasks = new Set(
    todaysTasks.flatMap((task) => [task.roundId, ...(task.previousRoundIds ?? [])].filter((roundId): roundId is string => Boolean(roundId))),
  );
  const completedRoundsToday = rounds.filter((round) =>
    round.status === 'done'
    && (
      round.taskIds.some((taskId) => todaysTaskIds.has(taskId))
      || roundIdsReferencedByTodayTasks.has(round.id)
    ));

  return {
    completedRounds: completedRoundsToday.length,
    focusedMinutes: completedRoundsToday.reduce((total, round) => total + round.durationMinutes, 0),
  };
};

export const getDashboardHeroCopy = (options: {
  phase: 'work' | 'short_break' | 'long_break';
  allTodaysTasksDone: boolean;
  currentRoundTaskCount: number;
}) => {
  const { phase, allTodaysTasksDone, currentRoundTaskCount } = options;

  if (allTodaysTasksDone) {
    return {
      overline: 'All tasks complete',
      title: 'All today\'s tasks are complete',
    };
  }

  if (phase !== 'work') {
    return {
      overline: 'Break in progress',
      title: 'Break in progress',
    };
  }

  return {
    overline: 'Active round',
    title: currentRoundTaskCount > 0 ? 'Your current round tasks' : 'Ready to plan your current round?',
  };
};
