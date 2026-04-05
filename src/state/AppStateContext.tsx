import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AlarmTone } from '../constants/alarmTones';
import {
  clearActivePomodoroNotification,
  clearScheduledPomodoroPhaseEndNotification,
  dismissNativeAlarmNotifications,
  notifyPomodoroComplete,
  requestNotificationPermissions,
  schedulePomodoroPhaseEndNotification,
  syncActivePomodoroNotification,
  startRepeatingAlarm,
} from '../services/notifications';
import { initializePushNotifications } from '../services/pushNotifications';
import { AppState, PomodoroState, Round, Task, TaskBankItem } from '../types';
import { buildNewRound, getDefaultRoundTitle, getRoundPlannedDate, isRoundCompleted, isRoundLockedByActivePomodoro, moveTaskInRound, removeRoundAndNormalizeStatuses, unassignTasksFromRound } from './rounds';
import { applyWorkPhaseRoundAdvance, getNextPomodoroPhase } from './pomodoroTransition';
import { getRemainingSecondsFromClock } from './pomodoroClock';
import { clearStoredState, createDemoState, loadState, saveState, seedState } from './storage';
import { getAssignmentRoundUpdate, getRevivedTaskRoundUpdate } from './taskRoundHistory';
import { getTodayKey } from '../utils';

type NewTask = Omit<Task, 'id' | 'status' | 'plannedDate' | 'completedAt'> & { plannedDate?: string };
type EditableTask = Omit<Task, 'status'>;
type NewTaskBankItem = Omit<TaskBankItem, 'id'>;
type EditableTaskBankItem = TaskBankItem;
type NewRound = Round;
type NewRoundOptions = { title?: string; taskIds?: string[]; plannedDate?: string };
const ALARM_REPEAT_COUNT = 3;

type Action =
  | { type: 'ADD_TASK'; payload: NewTask }
  | { type: 'UPDATE_TASK'; payload: EditableTask }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'ADD_TASK_FROM_BANK'; payload: { taskBankItemId: string; plannedDate?: string } }
  | { type: 'ADD_TASK_BANK_ITEM'; payload: NewTaskBankItem }
  | { type: 'UPDATE_TASK_BANK_ITEM'; payload: EditableTaskBankItem }
  | { type: 'DELETE_TASK_BANK_ITEM'; payload: { id: string } }
  | { type: 'TOGGLE_TASK'; payload: { id: string } }
  | { type: 'SET_USER_NAME'; payload: { userName: string } }
  | { type: 'ADD_CATEGORY'; payload: { category: string } }
  | { type: 'DELETE_CATEGORY'; payload: { category: string } }
  | { type: 'ADD_ROUND'; payload: NewRound }
  | { type: 'UPDATE_ROUND_TITLE'; payload: { roundId: string; title: string } }
  | { type: 'DELETE_ROUND'; payload: { roundId: string } }
  | { type: 'ASSIGN_TASKS_TO_ROUND'; payload: { roundId: string; taskIds: string[] } }
  | { type: 'MOVE_TASK_IN_ROUND'; payload: { roundId: string; taskId: string; direction: 'up' | 'down' } }
  | { type: 'AUTO_GROUP_TASKS_FOR_DATE'; payload: { plannedDate: string } }
  | { type: 'MOVE_ROUND'; payload: { roundId: string; direction: 'up' | 'down' } }
  | { type: 'SET_POMODORO_MINUTES'; payload: { minutes: number } }
  | { type: 'SET_SHORT_BREAK_MINUTES'; payload: { minutes: number } }
  | { type: 'SET_LONG_BREAK_MINUTES'; payload: { minutes: number } }
  | { type: 'SET_SESSIONS_BEFORE_LONG_BREAK'; payload: { sessions: number } }
  | { type: 'SET_SESSION_REVIEW_GRACE_SECONDS'; payload: { seconds: number } }
  | { type: 'SET_ALARM_TONE'; payload: { tone: AlarmTone } }
  | { type: 'SET_ALARM_VOLUME'; payload: { volume: number } }
  | { type: 'SET_SHOW_FIRST_TIME_GUIDANCE'; payload: { enabled: boolean } }
  | { type: 'SET_HAS_SEEN_WELCOME_MODAL'; payload: { seen: boolean } }
  | { type: 'LOAD_DEMO_DATA' }
  | { type: 'IMPORT_STATE'; payload: { state: AppState } }
  | { type: 'START_POMODORO'; payload: { taskId: string; roundId?: string; minutes?: number } }
  | { type: 'PAUSE_POMODORO' }
  | { type: 'COMPLETE_POMODORO' }
  | { type: 'SKIP_POMODORO' }
  | { type: 'ABANDON_ACTIVE_ROUND' }
  | { type: 'SYNC_POMODORO_CLOCK'; payload?: { now?: number } }
  | { type: 'RESET_POMODORO' }
  | { type: 'ADVANCE_POMODORO_PHASE' };

const createPomodoroSessionId = (): number => Math.floor(Date.now() % 2147483000);

const getPhaseSeconds = (state: AppState, phase: PomodoroState['phase']): number => {
  if (phase === 'short_break') return state.settings.shortBreakMinutes * 60;
  if (phase === 'long_break') return state.settings.longBreakMinutes * 60;
  return state.settings.pomodoroMinutes * 60;
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_TASK': {
      const id = crypto.randomUUID();
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id,
            status: 'todo',
            ...action.payload,
            plannedDate: action.payload.plannedDate ?? getTodayKey(),
          },
        ],
      };
    }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id !== action.payload.id ? task : { ...task, ...action.payload })),
      };
    case 'DELETE_TASK': {
      const remainingTasks = state.tasks.filter((task) => task.id !== action.payload.id);
      const activeTaskId = state.pomodoro.activeTaskId === action.payload.id ? undefined : state.pomodoro.activeTaskId;
      return {
        ...state,
        tasks: remainingTasks,
        rounds: state.rounds.map((round) => ({
          ...round,
          taskIds: round.taskIds.filter((id) => id !== action.payload.id),
        })),
        pomodoro: {
          ...state.pomodoro,
          activeTaskId,
          isRunning: activeTaskId ? state.pomodoro.isRunning : false,
          isPaused: activeTaskId ? state.pomodoro.isPaused : false,
          startTime: activeTaskId ? state.pomodoro.startTime : null,
          startedAt: activeTaskId ? state.pomodoro.startedAt : null,
          remaining: activeTaskId ? state.pomodoro.remaining : null,
        },
      };
    }
    case 'ADD_TASK_FROM_BANK': {
      const sourceTask = state.taskBank.find((item) => item.id === action.payload.taskBankItemId);
      if (!sourceTask) return state;
      return {
        ...state,
        tasks: [...state.tasks, { ...sourceTask, id: crypto.randomUUID(), status: 'todo', plannedDate: action.payload.plannedDate ?? getTodayKey() }],
      };
    }
    case 'ADD_TASK_BANK_ITEM': {
      const id = crypto.randomUUID();
      return { ...state, taskBank: [...state.taskBank, { ...action.payload, id }] };
    }
    case 'UPDATE_TASK_BANK_ITEM':
      return {
        ...state,
        taskBank: state.taskBank.map((task) => (task.id !== action.payload.id ? task : { ...task, ...action.payload })),
      };
    case 'DELETE_TASK_BANK_ITEM':
      return { ...state, taskBank: state.taskBank.filter((task) => task.id !== action.payload.id) };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.id) return task;

          const isDoneToTodo = task.status === 'done';
          if (!isDoneToTodo) {
            return {
              ...task,
              status: 'done',
              completedAt: new Date().toISOString(),
            };
          }

          return {
            ...task,
            status: 'todo',
            completedAt: undefined,
            ...getRevivedTaskRoundUpdate(task, state.rounds),
          };
        }),
      };
    case 'SET_USER_NAME':
      return { ...state, userName: action.payload.userName };
    case 'ADD_CATEGORY': {
      if (state.categories.includes(action.payload.category)) return state;
      return { ...state, categories: [...state.categories, action.payload.category] };
    }
    case 'DELETE_CATEGORY': {
      const category = action.payload.category;
      if (state.categories.length <= 1) return state;
      const nextCategories = state.categories.filter((item) => item !== category);
      const fallbackCategory = nextCategories[0] ?? 'Uncategorized';
      return {
        ...state,
        categories: nextCategories,
        tasks: state.tasks.map((task) => (task.category === category ? { ...task, category: fallbackCategory } : task)),
      };
    }
    case 'ADD_ROUND': {
      const roundPlannedDate = action.payload.plannedDate ?? getTodayKey();
      const hasOpenRound = state.rounds.some((round) => getRoundPlannedDate(round) === roundPlannedDate && round.status !== 'done');
      const assignedTaskIds = new Set(action.payload.taskIds);
      return {
        ...state,
        rounds: [
          ...state.rounds,
          {
            ...action.payload,
            plannedDate: roundPlannedDate,
            status: hasOpenRound ? 'upcoming' : 'active',
          },
        ],
        tasks: state.tasks.map((task) =>
          assignedTaskIds.has(task.id) && task.plannedDate === roundPlannedDate ? { ...task, roundId: action.payload.id } : task,
        ),
      };
    }
    case 'UPDATE_ROUND_TITLE':
      return {
        ...state,
        rounds: state.rounds.map((round) =>
          round.id === action.payload.roundId ? { ...round, title: action.payload.title } : round,
        ),
      };
    case 'DELETE_ROUND': {
      const roundId = action.payload.roundId;
      if (isRoundLockedByActivePomodoro(roundId, state.pomodoro.activeRoundId)) {
        return state;
      }
      const rounds = removeRoundAndNormalizeStatuses(state.rounds, roundId);
      const activeRoundId = state.pomodoro.activeRoundId === roundId ? undefined : state.pomodoro.activeRoundId;
      return {
        ...state,
        rounds,
        tasks: unassignTasksFromRound(state.tasks, roundId),
        pomodoro: {
          ...state.pomodoro,
          activeRoundId,
        },
      };
    }
    case 'ABANDON_ACTIVE_ROUND': {
      if (!state.pomodoro.activeRoundId) {
        return state;
      }
      const totalSeconds = state.settings.pomodoroMinutes * 60;
      return {
        ...state,
        rounds: removeRoundAndNormalizeStatuses(state.rounds, state.pomodoro.activeRoundId),
        tasks: unassignTasksFromRound(state.tasks, state.pomodoro.activeRoundId),
        pomodoro: {
          ...state.pomodoro,
          sessionId: null,
          startTime: null,
          duration: totalSeconds * 1000,
          remaining: null,
          isPaused: false,
          isRunning: false,
          startedAt: null,
          phase: 'work',
          totalSeconds,
          remainingSeconds: totalSeconds,
          activeTaskId: undefined,
          activeRoundId: undefined,
        },
      };
    }
    case 'ASSIGN_TASKS_TO_ROUND': {
      const { roundId, taskIds } = action.payload;
      const targetRound = state.rounds.find((round) => round.id === roundId);
      if (!targetRound || isRoundCompleted(targetRound)) {
        return state;
      }
      const targetRoundPlannedDate = getRoundPlannedDate(targetRound);
      const taskIdSet = new Set(taskIds);
      return {
        ...state,
        rounds: state.rounds.map((round) =>
          round.id === roundId
            ? { ...round, taskIds }
            : isRoundCompleted(round)
              || getRoundPlannedDate(round) !== targetRoundPlannedDate
              ? round
              : { ...round, taskIds: round.taskIds.filter((taskId) => !taskIdSet.has(taskId)) },
        ),
        tasks: state.tasks.map((task) => ({
          ...task,
          ...getAssignmentRoundUpdate(
            task,
            roundId,
            task.plannedDate === targetRoundPlannedDate && taskIdSet.has(task.id),
          ),
        })),
      };
    }
    case 'MOVE_TASK_IN_ROUND': {
      const { roundId, taskId, direction } = action.payload;
      const targetRound = state.rounds.find((round) => round.id === roundId);
      if (!targetRound || isRoundCompleted(targetRound)) {
        return state;
      }

      return {
        ...state,
        rounds: state.rounds.map((round) =>
          round.id === roundId
            ? { ...round, taskIds: moveTaskInRound(round.taskIds, taskId, direction) }
            : round,
        ),
      };
    }
    case 'AUTO_GROUP_TASKS_FOR_DATE': {
      const todayKey = action.payload.plannedDate;
      const openRounds = state.rounds.filter((round) => getRoundPlannedDate(round) === todayKey && !isRoundCompleted(round));
      const completedRounds = state.rounds.filter((round) => getRoundPlannedDate(round) === todayKey && isRoundCompleted(round));
      const untouchedRounds = state.rounds.filter((round) => getRoundPlannedDate(round) !== todayKey);
      const completedRoundIds = new Set(completedRounds.map((round) => round.id));
      const regroupableTodayTasks = state.tasks.filter((task) =>
        task.plannedDate === todayKey && !(task.status === 'done' && task.roundId && completedRoundIds.has(task.roundId)),
      );
      const regroupableTaskIds = new Set(regroupableTodayTasks.map((task) => task.id));
      const tasksByCategory = state.tasks
        .filter((task) => regroupableTaskIds.has(task.id))
        .reduce<Record<string, Task[]>>((acc, task) => {
          acc[task.category] = [...(acc[task.category] ?? []), task];
          return acc;
        }, {});
      const pomodoroLimit = state.settings.pomodoroMinutes;
      const groupedTaskIds: string[][] = [];

      Object.keys(tasksByCategory).forEach((category) => {
        let currentGroup: string[] = [];
        let currentMinutes = 0;
        tasksByCategory[category].forEach((task) => {
          const wouldExceed = currentMinutes + task.estimateMinutes > pomodoroLimit && currentGroup.length > 0;
          if (wouldExceed) {
            groupedTaskIds.push(currentGroup);
            currentGroup = [];
            currentMinutes = 0;
          }
          currentGroup.push(task.id);
          currentMinutes += task.estimateMinutes;
        });
        if (currentGroup.length > 0) groupedTaskIds.push(currentGroup);
      });

      if (groupedTaskIds.length === 0) return state;

      const reusedRounds = openRounds.slice(0, groupedTaskIds.length).map((round, index) => ({
        ...round,
        status: (index === 0 ? 'active' : 'upcoming') as 'active' | 'upcoming',
        durationMinutes: pomodoroLimit,
        taskIds: groupedTaskIds[index],
      }));
      const extraRounds: Round[] = [];
      groupedTaskIds.slice(reusedRounds.length).forEach((taskIds, index) => {
        extraRounds.push({
          id: crypto.randomUUID(),
          title: getDefaultRoundTitle([...state.rounds, ...extraRounds], todayKey),
          plannedDate: todayKey,
          scheduledTime: '',
          durationMinutes: pomodoroLimit,
          taskIds,
          status: (reusedRounds.length + index === 0 ? 'active' : 'upcoming') as 'active' | 'upcoming',
        });
      });
      const nextOpenRounds = [...reusedRounds, ...extraRounds];
      const roundIdsInUse = new Set([...nextOpenRounds, ...completedRounds].map((round) => round.id));

      return {
        ...state,
        rounds: [...untouchedRounds, ...nextOpenRounds, ...completedRounds],
        tasks: state.tasks.map((task) => {
          if (!regroupableTaskIds.has(task.id)) return task;
          if (task.plannedDate !== todayKey) return task;
          const assignedRound = nextOpenRounds.find((round) => round.taskIds.includes(task.id));
          return { ...task, roundId: assignedRound?.id };
        }).map((task) => (task.roundId && !roundIdsInUse.has(task.roundId) ? { ...task, roundId: undefined } : task)),
      };
    }
    case 'MOVE_ROUND': {
      const index = state.rounds.findIndex((round) => round.id === action.payload.roundId);
      if (index < 0) return state;
      const movingRoundDate = getRoundPlannedDate(state.rounds[index]);
      const targetIndex = action.payload.direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.rounds.length) return state;
      if (getRoundPlannedDate(state.rounds[targetIndex]) !== movingRoundDate) return state;
      const rounds = [...state.rounds];
      const [moving] = rounds.splice(index, 1);
      rounds.splice(targetIndex, 0, moving);
      const firstOpenRoundId = rounds.find((round) => round.status !== 'done' && getRoundPlannedDate(round) === movingRoundDate)?.id;
      return {
        ...state,
        rounds: rounds.map((round) =>
          round.status === 'done' || getRoundPlannedDate(round) !== movingRoundDate
            ? round
            : { ...round, status: round.id === firstOpenRoundId ? 'active' : 'upcoming' },
        ),
      };
    }
    case 'SET_POMODORO_MINUTES': {
      const minutes = Math.max(1, Math.round(action.payload.minutes));
      const nextState = {
        ...state,
        settings: { ...state.settings, pomodoroMinutes: minutes },
        rounds: state.rounds.map((round) => ({ ...round, durationMinutes: minutes })),
      };
      if (state.pomodoro.phase !== 'work') return nextState;
      return {
        ...nextState,
        pomodoro: {
          ...state.pomodoro,
          totalSeconds: minutes * 60,
          remainingSeconds: state.pomodoro.isRunning ? state.pomodoro.remainingSeconds : minutes * 60,
        },
      };
    }
    case 'SET_SHORT_BREAK_MINUTES': {
      const minutes = Math.max(1, Math.round(action.payload.minutes));
      const nextState = { ...state, settings: { ...state.settings, shortBreakMinutes: minutes } };
      if (state.pomodoro.phase !== 'short_break') return nextState;
      return {
        ...nextState,
        pomodoro: {
          ...state.pomodoro,
          totalSeconds: minutes * 60,
          remainingSeconds: state.pomodoro.isRunning ? state.pomodoro.remainingSeconds : minutes * 60,
        },
      };
    }
    case 'SET_LONG_BREAK_MINUTES': {
      const minutes = Math.max(1, Math.round(action.payload.minutes));
      const nextState = { ...state, settings: { ...state.settings, longBreakMinutes: minutes } };
      if (state.pomodoro.phase !== 'long_break') return nextState;
      return {
        ...nextState,
        pomodoro: {
          ...state.pomodoro,
          totalSeconds: minutes * 60,
          remainingSeconds: state.pomodoro.isRunning ? state.pomodoro.remainingSeconds : minutes * 60,
        },
      };
    }
    case 'SET_SESSIONS_BEFORE_LONG_BREAK':
      return {
        ...state,
        settings: {
          ...state.settings,
          sessionsBeforeLongBreak: Math.max(2, Math.round(action.payload.sessions)),
        },
      };
    case 'SET_SESSION_REVIEW_GRACE_SECONDS':
      return {
        ...state,
        settings: {
          ...state.settings,
          sessionReviewGraceSeconds: Math.max(5, Math.min(600, Math.round(action.payload.seconds))),
        },
      };
    case 'SET_ALARM_TONE':
      return {
        ...state,
        settings: {
          ...state.settings,
          alarmTone: action.payload.tone,
        },
      };
    case 'SET_ALARM_VOLUME':
      return {
        ...state,
        settings: {
          ...state.settings,
          alarmVolume: Math.max(0, Math.min(100, Math.round(action.payload.volume))),
        },
      };
    case 'SET_SHOW_FIRST_TIME_GUIDANCE':
      return {
        ...state,
        settings: {
          ...state.settings,
          showFirstTimeGuidance: action.payload.enabled,
        },
      };
    case 'SET_HAS_SEEN_WELCOME_MODAL':
      return {
        ...state,
        settings: {
          ...state.settings,
          hasSeenWelcomeModal: action.payload.seen,
        },
      };
    case 'LOAD_DEMO_DATA':
      return createDemoState(state);
    case 'IMPORT_STATE':
      return action.payload.state;
    case 'START_POMODORO': {
      const phase = state.pomodoro.phase;
      const totalSeconds = action.payload.minutes ? action.payload.minutes * 60 : getPhaseSeconds(state, phase);
      const isResume = state.pomodoro.isPaused && typeof state.pomodoro.remaining === 'number' && state.pomodoro.remaining > 0;
      const duration = isResume ? (state.pomodoro.remaining ?? totalSeconds * 1000) : totalSeconds * 1000;
      const now = Date.now();
      const pomodoro: PomodoroState = {
        ...state.pomodoro,
        sessionId: state.pomodoro.sessionId ?? createPomodoroSessionId(),
        startTime: now,
        duration,
        remaining: null,
        isPaused: false,
        isRunning: true,
        startedAt: now,
        totalSeconds: Math.ceil(duration / 1000),
        remainingSeconds: Math.ceil(duration / 1000),
        activeTaskId: phase === 'work' ? action.payload.taskId : state.pomodoro.activeTaskId,
        activeRoundId: phase === 'work' ? action.payload.roundId : state.pomodoro.activeRoundId,
      };
      return { ...state, pomodoro };
    }
    case 'PAUSE_POMODORO': {
      const remaining = state.pomodoro.startTime
        ? Math.max(0, state.pomodoro.startTime + state.pomodoro.duration - Date.now())
        : state.pomodoro.remaining ?? state.pomodoro.remainingSeconds * 1000;
      if (remaining <= 0) {
        return {
          ...state,
          pomodoro: {
            ...state.pomodoro,
            isPaused: false,
            isRunning: false,
            startTime: null,
            startedAt: null,
            remaining: 0,
            remainingSeconds: 0,
          },
        };
      }
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          isPaused: true,
          isRunning: false,
          startTime: null,
          startedAt: null,
          remaining,
          remainingSeconds: Math.ceil(remaining / 1000),
        },
      };
    }
    case 'COMPLETE_POMODORO':
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          isPaused: false,
          isRunning: false,
          startTime: null,
          startedAt: null,
          remaining: 0,
          remainingSeconds: 0,
        },
      };
    case 'SKIP_POMODORO': {
      const completedWorkSessions =
        state.pomodoro.phase === 'work' ? state.pomodoro.completedWorkSessions + 1 : state.pomodoro.completedWorkSessions;
      const nextPhase = getNextPomodoroPhase(state);
      const totalSeconds = getPhaseSeconds(state, nextPhase);
      const roundProgression = applyWorkPhaseRoundAdvance(state);
      const now = Date.now();

      return {
        ...state,
        rounds: roundProgression?.rounds ?? state.rounds,
        tasks: roundProgression?.tasks ?? state.tasks,
        pomodoro: {
          ...state.pomodoro,
          sessionId: createPomodoroSessionId(),
          startTime: now,
          duration: totalSeconds * 1000,
          remaining: null,
          isPaused: false,
          phase: nextPhase,
          completedWorkSessions,
          isRunning: true,
          startedAt: now,
          totalSeconds,
          remainingSeconds: totalSeconds,
          activeRoundId: roundProgression ? roundProgression.nextRoundId : state.pomodoro.activeRoundId,
        },
      };
    }
    case 'SYNC_POMODORO_CLOCK': {
      if (!state.pomodoro.isRunning || state.pomodoro.remainingSeconds <= 0) return state;
      const remainingSeconds = getRemainingSecondsFromClock(
        state.pomodoro.startedAt,
        state.pomodoro.totalSeconds,
        action.payload?.now,
      );
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          remainingSeconds,
        },
      };
    }
    case 'RESET_POMODORO': {
      const totalSeconds = getPhaseSeconds(state, state.pomodoro.phase);
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          sessionId: null,
          startTime: null,
          duration: totalSeconds * 1000,
          remaining: null,
          isPaused: false,
          isRunning: false,
          startedAt: null,
          totalSeconds,
          remainingSeconds: totalSeconds,
        },
      };
    }
    case 'ADVANCE_POMODORO_PHASE': {
      const completedWorkSessions =
        state.pomodoro.phase === 'work' ? state.pomodoro.completedWorkSessions + 1 : state.pomodoro.completedWorkSessions;

      const nextPhase = getNextPomodoroPhase(state);
      const totalSeconds = getPhaseSeconds(state, nextPhase);
      const roundProgression = applyWorkPhaseRoundAdvance(state);
      const now = Date.now();

      return {
        ...state,
        rounds: roundProgression?.rounds ?? state.rounds,
        tasks: roundProgression?.tasks ?? state.tasks,
        pomodoro: {
          ...state.pomodoro,
          sessionId: createPomodoroSessionId(),
          startTime: now,
          duration: totalSeconds * 1000,
          remaining: null,
          isPaused: false,
          phase: nextPhase,
          completedWorkSessions,
          isRunning: true,
          startedAt: now,
          totalSeconds,
          remainingSeconds: totalSeconds,
          activeRoundId: roundProgression ? roundProgression.nextRoundId : state.pomodoro.activeRoundId,
        },
      };
    }
    default:
      return state;
  }
};

interface AppStateContextValue {
  state: AppState;
  alarmActive: boolean;
  successMessage: string | null;
  addTask: (task: NewTask) => void;
  addTaskFromBank: (taskBankItemId: string, plannedDate?: string) => void;
  updateTask: (task: EditableTask) => void;
  deleteTask: (id: string) => void;
  addTaskBankItem: (task: NewTaskBankItem) => void;
  updateTaskBankItem: (task: EditableTaskBankItem) => void;
  deleteTaskBankItem: (id: string) => void;
  toggleTask: (id: string) => void;
  setUserName: (userName: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  createRound: (options?: NewRoundOptions) => string;
  updateRoundTitle: (roundId: string, title: string) => void;
  deleteRound: (roundId: string) => void;
  assignTasksToRound: (roundId: string, taskIds: string[]) => void;
  moveTaskInRound: (roundId: string, taskId: string, direction: 'up' | 'down') => void;
  autoGroupTasksForDate: (plannedDate: string) => void;
  moveRound: (roundId: string, direction: 'up' | 'down') => void;
  setPomodoroMinutes: (minutes: number) => void;
  setShortBreakMinutes: (minutes: number) => void;
  setLongBreakMinutes: (minutes: number) => void;
  setSessionsBeforeLongBreak: (sessions: number) => void;
  setSessionReviewGraceSeconds: (seconds: number) => void;
  setAlarmTone: (tone: AlarmTone) => void;
  setAlarmVolume: (volume: number) => void;
  setShowFirstTimeGuidance: (enabled: boolean) => void;
  setHasSeenWelcomeModal: (seen: boolean) => void;
  loadDemoData: () => void;
  importState: (nextState: AppState) => void;
  clearAllData: () => void;
  startPomodoro: (taskId: string, roundId?: string, minutes?: number) => void;
  pausePomodoro: () => void;
  completePomodoro: () => void;
  skipPomodoro: () => void;
  abandonActiveRound: () => void;
  resetPomodoro: () => void;
  dismissAlarm: () => void;
  showSuccessMessage: (message: string) => void;
  clearSuccessMessage: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const getActiveRoundTaskSummary = (state: AppState): { hasRound: boolean; unfinishedTaskCount: number } => {
  const activeRound =
    state.rounds.find((round) => round.id === state.pomodoro.activeRoundId)
    ?? state.rounds.find((round) => round.status === 'active');
  if (!activeRound) {
    return { hasRound: false, unfinishedTaskCount: 0 };
  }

  const unfinishedTaskCount = activeRound.taskIds
    .map((taskId) => state.tasks.find((task) => task.id === taskId))
    .filter((task): task is Task => !!task && task.status !== 'done')
    .length;
  return { hasRound: true, unfinishedTaskCount };
};

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [alarmActive, setAlarmActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAppActive, setIsAppActive] = useState(() => document.visibilityState !== 'hidden');
  const stopAlarmRef = useRef<(() => void) | null>(null);
  const handledCompletionAlarmKeyRef = useRef<string | null>(null);
  const activeNotificationSyncRef = useRef({
    isAppActive: document.visibilityState !== 'hidden',
    isRunning: state.pomodoro.isRunning,
    phase: state.pomodoro.phase,
  });

  useEffect(() => {
    requestNotificationPermissions().catch(() => undefined);
    initializePushNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const syncClock = () => dispatch({ type: 'SYNC_POMODORO_CLOCK', payload: { now: Date.now() } });
    syncClock();

    const onFocus = () => {
      setIsAppActive(true);
      syncClock();
    };
    const onBlur = () => {
      setIsAppActive(false);
    };
    const onVisibilityChange = () => {
      setIsAppActive(document.visibilityState !== 'hidden');
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    let isMounted = true;
    let removeNativeListener: (() => void) | undefined;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      setIsAppActive(isActive);
      if (isActive) {
        syncClock();
      }
    })
      .then((listener) => {
        if (!isMounted) {
          void listener.remove();
          return;
        }
        removeNativeListener = () => {
          void listener.remove();
        };
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      removeNativeListener?.();
    };
  }, []);

  useEffect(() => {
    if (!state.pomodoro.isRunning || !state.pomodoro.startedAt || state.pomodoro.remainingSeconds <= 0) return;
    const interval = window.setInterval(() => {
      dispatch({ type: 'SYNC_POMODORO_CLOCK', payload: { now: Date.now() } });
    }, 1000);
    const timeout = window.setTimeout(() => {
      dispatch({ type: 'SYNC_POMODORO_CLOCK', payload: { now: Date.now() } });
    }, state.pomodoro.remainingSeconds * 1000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [state.pomodoro.isRunning, state.pomodoro.startedAt, state.pomodoro.remainingSeconds]);

  useEffect(() => {
    const previousState = activeNotificationSyncRef.current;
    const nextState = {
      isAppActive,
      isRunning: state.pomodoro.isRunning,
      phase: state.pomodoro.phase,
    };
    activeNotificationSyncRef.current = nextState;

    if (isAppActive || !state.pomodoro.isRunning || state.pomodoro.remainingSeconds <= 0) {
      clearActivePomodoroNotification().catch(() => undefined);
      return;
    }

    const becameInactive = previousState.isAppActive && !isAppActive;
    const runningStateChanged = previousState.isRunning !== state.pomodoro.isRunning;
    const phaseChanged = previousState.phase !== state.pomodoro.phase;
    if (!becameInactive && !runningStateChanged && !phaseChanged) return;

    syncActivePomodoroNotification(state.pomodoro.phase, state.pomodoro.remainingSeconds).catch(() => undefined);
  }, [isAppActive, state.pomodoro.isRunning, state.pomodoro.phase, state.pomodoro.remainingSeconds]);

  useEffect(() => {
    const titleByPhase: Record<PomodoroState['phase'], string> = {
      work: 'Focus session complete',
      short_break: 'Short break complete',
      long_break: 'Long break complete',
    };
    const bodyByPhase: Record<PomodoroState['phase'], string> = {
      work: 'Round complete. Your break is ready to start.',
      short_break: 'Back to focus mode.',
      long_break: 'Great work. Start your next focus session.',
    };

    if (!state.pomodoro.isRunning || !state.pomodoro.startTime || state.pomodoro.duration <= 0 || !state.pomodoro.sessionId) {
      clearScheduledPomodoroPhaseEndNotification(state.pomodoro.sessionId).catch(() => undefined);
      return;
    }

    schedulePomodoroPhaseEndNotification(
      state.pomodoro.sessionId,
      state.pomodoro.startTime,
      state.pomodoro.duration,
      titleByPhase[state.pomodoro.phase],
      bodyByPhase[state.pomodoro.phase],
      state.settings.alarmTone,
    ).catch(() => undefined);
  }, [
    state.pomodoro.isRunning,
    state.pomodoro.sessionId,
    state.pomodoro.startTime,
    state.pomodoro.duration,
    state.pomodoro.phase,
    state.settings.alarmTone,
  ]);

  useEffect(() => {
    if (state.pomodoro.remainingSeconds !== 0 || !state.pomodoro.isRunning) {
      handledCompletionAlarmKeyRef.current = null;
      return;
    }

    const completionAlarmKey = `${state.pomodoro.sessionId ?? 'no-session'}:${state.pomodoro.phase}:${state.pomodoro.startTime ?? 0}`;
    if (handledCompletionAlarmKeyRef.current === completionAlarmKey) return;
    handledCompletionAlarmKeyRef.current = completionAlarmKey;

    const titleByPhase: Record<PomodoroState['phase'], string> = {
      work: 'Focus session complete',
      short_break: 'Short break complete',
      long_break: 'Long break complete',
    };
    const bodyByPhase: Record<PomodoroState['phase'], string> = {
      work: 'Round complete. Your break is ready to start.',
      short_break: 'Back to focus mode.',
      long_break: 'Great work. Start your next focus session.',
    };

    notifyPomodoroComplete(
      titleByPhase[state.pomodoro.phase],
      bodyByPhase[state.pomodoro.phase],
      state.settings.alarmTone,
    ).catch(() => undefined);
    clearScheduledPomodoroPhaseEndNotification(state.pomodoro.sessionId).catch(() => undefined);

    stopAlarmRef.current?.();
    if (Capacitor.isNativePlatform()) {
      stopAlarmRef.current = null;
      setAlarmActive(false);
    } else {
      setAlarmActive(true);
      stopAlarmRef.current = startRepeatingAlarm(state.settings.alarmTone, ALARM_REPEAT_COUNT, state.settings.alarmVolume / 100, () => {
        stopAlarmRef.current = null;
        setAlarmActive(false);
      });
    }
    if (state.pomodoro.phase !== 'work') {
      dispatch({ type: 'ADVANCE_POMODORO_PHASE' });
      return;
    }

    const { hasRound, unfinishedTaskCount } = getActiveRoundTaskSummary(state);
    if (hasRound && unfinishedTaskCount > 0) {
      dispatch({ type: 'COMPLETE_POMODORO' });
      return;
    }

    dispatch({ type: 'ADVANCE_POMODORO_PHASE' });
  }, [state, state.pomodoro.remainingSeconds, state.pomodoro.isRunning, state.pomodoro.phase, state.pomodoro.sessionId, state.pomodoro.startTime, state.settings.alarmTone, state.settings.alarmVolume]);

  const dismissAlarm = () => {
    stopAlarmRef.current?.();
    stopAlarmRef.current = null;
    setAlarmActive(false);
    dismissNativeAlarmNotifications().catch(() => undefined);
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
  };

  const clearSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const clearAllData = useCallback(() => {
    stopAlarmRef.current?.();
    stopAlarmRef.current = null;
    setAlarmActive(false);
    clearScheduledPomodoroPhaseEndNotification(state.pomodoro.sessionId).catch(() => undefined);
    dismissNativeAlarmNotifications().catch(() => undefined);
    clearStoredState();
    dispatch({ type: 'IMPORT_STATE', payload: { state: seedState } });
  }, [state.pomodoro.sessionId]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      alarmActive,
      successMessage,
      addTask: (task) => dispatch({ type: 'ADD_TASK', payload: task }),
      addTaskFromBank: (taskBankItemId, plannedDate) => dispatch({ type: 'ADD_TASK_FROM_BANK', payload: { taskBankItemId, plannedDate } }),
      updateTask: (task) => dispatch({ type: 'UPDATE_TASK', payload: task }),
      deleteTask: (id) => dispatch({ type: 'DELETE_TASK', payload: { id } }),
      addTaskBankItem: (task) => dispatch({ type: 'ADD_TASK_BANK_ITEM', payload: task }),
      updateTaskBankItem: (task) => dispatch({ type: 'UPDATE_TASK_BANK_ITEM', payload: task }),
      deleteTaskBankItem: (id) => dispatch({ type: 'DELETE_TASK_BANK_ITEM', payload: { id } }),
      toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', payload: { id } }),
      setUserName: (userName) => dispatch({ type: 'SET_USER_NAME', payload: { userName } }),
      addCategory: (category) => dispatch({ type: 'ADD_CATEGORY', payload: { category } }),
      deleteCategory: (category) => dispatch({ type: 'DELETE_CATEGORY', payload: { category } }),
      createRound: (options) => {
        const newRound = buildNewRound(state.rounds, state.settings.pomodoroMinutes, options);
        dispatch({
          type: 'ADD_ROUND',
          payload: newRound,
        });
        return newRound.id;
      },
      updateRoundTitle: (roundId, title) =>
        dispatch({ type: 'UPDATE_ROUND_TITLE', payload: { roundId, title } }),
      deleteRound: (roundId) => dispatch({ type: 'DELETE_ROUND', payload: { roundId } }),
      assignTasksToRound: (roundId, taskIds) => dispatch({ type: 'ASSIGN_TASKS_TO_ROUND', payload: { roundId, taskIds } }),
      moveTaskInRound: (roundId, taskId, direction) => dispatch({ type: 'MOVE_TASK_IN_ROUND', payload: { roundId, taskId, direction } }),
      autoGroupTasksForDate: (plannedDate) => dispatch({ type: 'AUTO_GROUP_TASKS_FOR_DATE', payload: { plannedDate } }),
      moveRound: (roundId, direction) => dispatch({ type: 'MOVE_ROUND', payload: { roundId, direction } }),
      setPomodoroMinutes: (minutes) => dispatch({ type: 'SET_POMODORO_MINUTES', payload: { minutes } }),
      setShortBreakMinutes: (minutes) => dispatch({ type: 'SET_SHORT_BREAK_MINUTES', payload: { minutes } }),
      setLongBreakMinutes: (minutes) => dispatch({ type: 'SET_LONG_BREAK_MINUTES', payload: { minutes } }),
      setSessionsBeforeLongBreak: (sessions) => dispatch({ type: 'SET_SESSIONS_BEFORE_LONG_BREAK', payload: { sessions } }),
      setSessionReviewGraceSeconds: (seconds) => dispatch({ type: 'SET_SESSION_REVIEW_GRACE_SECONDS', payload: { seconds } }),
      setAlarmTone: (tone) => dispatch({ type: 'SET_ALARM_TONE', payload: { tone } }),
      setAlarmVolume: (volume) => dispatch({ type: 'SET_ALARM_VOLUME', payload: { volume } }),
      setShowFirstTimeGuidance: (enabled) => dispatch({ type: 'SET_SHOW_FIRST_TIME_GUIDANCE', payload: { enabled } }),
      setHasSeenWelcomeModal: (seen) => dispatch({ type: 'SET_HAS_SEEN_WELCOME_MODAL', payload: { seen } }),
      loadDemoData: () => dispatch({ type: 'LOAD_DEMO_DATA' }),
      importState: (nextState) => dispatch({ type: 'IMPORT_STATE', payload: { state: nextState } }),
      clearAllData,
      startPomodoro: (taskId, roundId, minutes) => dispatch({ type: 'START_POMODORO', payload: { taskId, roundId, minutes } }),
      pausePomodoro: () => dispatch({ type: 'PAUSE_POMODORO' }),
      completePomodoro: () => dispatch({ type: 'COMPLETE_POMODORO' }),
      skipPomodoro: () => dispatch({ type: 'SKIP_POMODORO' }),
      abandonActiveRound: () => dispatch({ type: 'ABANDON_ACTIVE_ROUND' }),
      resetPomodoro: () => dispatch({ type: 'RESET_POMODORO' }),
      dismissAlarm,
      showSuccessMessage,
      clearSuccessMessage,
    }),
    [state, alarmActive, successMessage, clearAllData],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return context;
};
