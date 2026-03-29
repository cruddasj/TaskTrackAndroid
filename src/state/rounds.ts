import { Round } from '../types';

export const hasEmptyRoundWithoutTasks = (rounds: Round[]): boolean => rounds.some((round) => round.taskIds.length === 0);

export const buildNewRound = (rounds: Round[], pomodoroMinutes: number): Round => ({
  id: crypto.randomUUID(),
  title: `Round ${rounds.length + 1}`,
  scheduledTime: '',
  durationMinutes: pomodoroMinutes,
  taskIds: [],
  status: rounds.some((round) => round.status !== 'done') ? 'upcoming' : 'active',
});
