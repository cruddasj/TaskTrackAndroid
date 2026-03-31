import { Round, Task } from '../types';

export interface TodayRoundMetrics {
  completedRounds: number;
  focusedMinutes: number;
}

export const getTodayRoundMetrics = (rounds: Round[], todaysTasks: Task[]): TodayRoundMetrics => {
  const todaysTaskIds = new Set(todaysTasks.map((task) => task.id));
  const completedRoundsToday = rounds.filter((round) =>
    round.status === 'done' && round.taskIds.some((taskId) => todaysTaskIds.has(taskId)));

  return {
    completedRounds: completedRoundsToday.length,
    focusedMinutes: completedRoundsToday.reduce((total, round) => total + round.durationMinutes, 0),
  };
};
