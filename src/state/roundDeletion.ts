import { Task } from '../types';

export const getTasksAfterRoundDeletion = (
  tasks: Task[],
  roundId: string,
  reviveCompletedTasks: boolean,
): Task[] => tasks.map((task) => {
  if (task.roundId !== roundId) {
    return task;
  }

  if (!reviveCompletedTasks) {
    return {
      ...task,
      roundId: undefined,
    };
  }

  return {
    ...task,
    roundId: undefined,
    status: 'todo',
    completedAt: undefined,
  };
});
