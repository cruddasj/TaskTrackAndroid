import { AppState, PomodoroState, Round, Task } from '../types';
import { advanceActiveRound, buildNewRound, getRoundPlannedDate } from './rounds';
import { getTodayKey } from '../utils';

export const getNextPomodoroPhase = (state: AppState): PomodoroState['phase'] => {
  if (state.pomodoro.phase !== 'work') return 'work';
  const completedWorkSessions = state.pomodoro.completedWorkSessions + 1;
  return completedWorkSessions % state.settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break';
};

export const getRoundProgressionForPhaseAdvance = (state: AppState) =>
  state.pomodoro.phase === 'work'
    ? (() => {
      const todayKey = getTodayKey();
      const todayRounds = state.rounds.filter((round) => getRoundPlannedDate(round) === todayKey);
      const nonTodayRounds = state.rounds.filter((round) => getRoundPlannedDate(round) !== todayKey);
      const progression = advanceActiveRound(todayRounds, state.pomodoro.activeRoundId);
      return {
        nextRoundId: progression.nextRoundId,
        rounds: [...nonTodayRounds, ...progression.rounds],
      };
    })()
    : undefined;

interface RoundAdvanceResult {
  rounds: Round[];
  tasks: Task[];
  nextRoundId?: string;
}

export const applyWorkPhaseRoundAdvance = (state: AppState): RoundAdvanceResult | undefined => {
  const progression = getRoundProgressionForPhaseAdvance(state);
  if (!progression) {
    return undefined;
  }

  if (progression.nextRoundId) {
    return {
      rounds: progression.rounds,
      tasks: state.tasks,
      nextRoundId: progression.nextRoundId,
    };
  }

  const todayKey = getTodayKey();
  const roundIds = new Set(progression.rounds.map((round) => round.id));
  const unassignedTodayTaskIds = state.tasks
    .filter((task) =>
      task.plannedDate === todayKey
      && task.status !== 'done'
      && (!task.roundId || !roundIds.has(task.roundId)))
    .map((task) => task.id);

  if (unassignedTodayTaskIds.length === 0) {
    return {
      rounds: progression.rounds,
      tasks: state.tasks,
      nextRoundId: undefined,
    };
  }

  const recoveryRound = {
    ...buildNewRound(progression.rounds, state.settings.pomodoroMinutes, { plannedDate: todayKey }),
    taskIds: unassignedTodayTaskIds,
  };

  return {
    rounds: [...progression.rounds, recoveryRound],
    tasks: state.tasks.map((task) =>
      unassignedTodayTaskIds.includes(task.id) ? { ...task, roundId: recoveryRound.id } : task),
    nextRoundId: recoveryRound.id,
  };
};
