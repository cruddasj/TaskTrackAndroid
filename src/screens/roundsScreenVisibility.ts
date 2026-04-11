import { Round, Task } from '../types';

export const getUnassignedTodoTasks = (todaysTasks: Task[], roundIds: Set<string>): Task[] =>
  todaysTasks
    .filter((task) => task.status !== 'done' && (!task.roundId || !roundIds.has(task.roundId)))
    .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }));

export const shouldShowCategoryGroupingSuggestion = (todaysTasks: Task[]): boolean =>
  todaysTasks.some((task) => task.status !== 'done' && !task.roundId);

export interface RoundDisplaySections {
  plannedRounds: Round[];
  completedRounds: Round[];
}

export const getRoundDisplaySections = (orderedRounds: Round[]): RoundDisplaySections => ({
  plannedRounds: orderedRounds.filter((round) => round.status !== 'done'),
  completedRounds: orderedRounds.filter((round) => round.status === 'done'),
});
