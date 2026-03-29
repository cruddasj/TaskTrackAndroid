import { Round, Task } from '../types';

export const hasEmptyRoundWithoutTasks = (rounds: Round[]): boolean => rounds.some((round) => round.taskIds.length === 0);

export const buildNewRound = (rounds: Round[], pomodoroMinutes: number): Round => ({
  id: crypto.randomUUID(),
  title: `Round ${rounds.length + 1}`,
  scheduledTime: '',
  durationMinutes: pomodoroMinutes,
  taskIds: [],
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
