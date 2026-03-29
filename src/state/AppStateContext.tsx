import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AlarmTone, dismissNativeAlarmNotifications, notifyPomodoroComplete, requestNotificationPermissions, startRepeatingAlarm } from '../services/notifications';
import { AppState, PomodoroState, Round, Task, TaskBankItem } from '../types';
import { buildNewRound, removeRoundAndNormalizeStatuses, unassignTasksFromRound } from './rounds';
import { loadState, saveState } from './storage';

type NewTask = Omit<Task, 'id' | 'status' | 'plannedDate' | 'completedAt'>;
type EditableTask = Omit<Task, 'status'>;
type NewTaskBankItem = Omit<TaskBankItem, 'id'>;
type EditableTaskBankItem = TaskBankItem;
type NewRound = Round;

type Action =
  | { type: 'ADD_TASK'; payload: NewTask }
  | { type: 'UPDATE_TASK'; payload: EditableTask }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'ADD_TASK_FROM_BANK'; payload: { taskBankItemId: string } }
  | { type: 'ADD_TASK_BANK_ITEM'; payload: NewTaskBankItem }
  | { type: 'UPDATE_TASK_BANK_ITEM'; payload: EditableTaskBankItem }
  | { type: 'DELETE_TASK_BANK_ITEM'; payload: { id: string } }
  | { type: 'TOGGLE_TASK'; payload: { id: string } }
  | { type: 'SET_USER_NAME'; payload: { userName: string } }
  | { type: 'ADD_CATEGORY'; payload: { category: string } }
  | { type: 'DELETE_CATEGORY'; payload: { category: string } }
  | { type: 'ADD_ROUND'; payload: NewRound }
  | { type: 'DELETE_ROUND'; payload: { roundId: string } }
  | { type: 'ASSIGN_TASKS_TO_ROUND'; payload: { roundId: string; taskIds: string[] } }
  | { type: 'AUTO_GROUP_TODAY_TASKS' }
  | { type: 'MOVE_ROUND'; payload: { roundId: string; direction: 'up' | 'down' } }
  | { type: 'SET_POMODORO_MINUTES'; payload: { minutes: number } }
  | { type: 'SET_SHORT_BREAK_MINUTES'; payload: { minutes: number } }
  | { type: 'SET_LONG_BREAK_MINUTES'; payload: { minutes: number } }
  | { type: 'SET_SESSIONS_BEFORE_LONG_BREAK'; payload: { sessions: number } }
  | { type: 'SET_ALARM_TONE'; payload: { tone: AlarmTone } }
  | { type: 'SET_ALARM_REPEAT_COUNT'; payload: { count: number } }
  | { type: 'SET_SHOW_FIRST_TIME_GUIDANCE'; payload: { enabled: boolean } }
  | { type: 'START_POMODORO'; payload: { taskId: string; roundId?: string; minutes?: number } }
  | { type: 'PAUSE_POMODORO' }
  | { type: 'COMPLETE_POMODORO' }
  | { type: 'TICK' }
  | { type: 'RESET_POMODORO' }
  | { type: 'ADVANCE_POMODORO_PHASE' };

const getPhaseSeconds = (state: AppState, phase: PomodoroState['phase']): number => {
  if (phase === 'short_break') return state.settings.shortBreakMinutes * 60;
  if (phase === 'long_break') return state.settings.longBreakMinutes * 60;
  return state.settings.pomodoroMinutes * 60;
};

const getTodayKey = (): string => new Date().toISOString().slice(0, 10);

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
            plannedDate: getTodayKey(),
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
          startedAt: activeTaskId ? state.pomodoro.startedAt : null,
        },
      };
    }
    case 'ADD_TASK_FROM_BANK': {
      const sourceTask = state.taskBank.find((item) => item.id === action.payload.taskBankItemId);
      if (!sourceTask) return state;
      return {
        ...state,
        tasks: [...state.tasks, { ...sourceTask, id: crypto.randomUUID(), status: 'todo', plannedDate: getTodayKey() }],
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
        tasks: state.tasks.map((task) =>
          task.id !== action.payload.id
            ? task
            : {
              ...task,
              status: task.status === 'done' ? 'todo' : 'done',
              completedAt: task.status === 'done' ? undefined : new Date().toISOString(),
            },
        ),
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
      const hasOpenRound = state.rounds.some((round) => round.status !== 'done');
      return {
        ...state,
        rounds: [
          ...state.rounds,
          {
            ...action.payload,
            status: hasOpenRound ? 'upcoming' : 'active',
          },
        ],
      };
    }
    case 'DELETE_ROUND': {
      const roundId = action.payload.roundId;
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
    case 'ASSIGN_TASKS_TO_ROUND': {
      const { roundId, taskIds } = action.payload;
      const taskIdSet = new Set(taskIds);
      return {
        ...state,
        rounds: state.rounds.map((round) =>
          round.id === roundId ? { ...round, taskIds } : { ...round, taskIds: round.taskIds.filter((taskId) => !taskIdSet.has(taskId)) },
        ),
        tasks: state.tasks.map((task) => {
          if (taskIdSet.has(task.id)) return { ...task, roundId };
          if (task.roundId === roundId) return { ...task, roundId: undefined };
          return task;
        }),
      };
    }
    case 'AUTO_GROUP_TODAY_TASKS': {
      const todayKey = getTodayKey();
      const tasksByCategory = state.tasks
        .filter((task) => task.plannedDate === todayKey)
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

      const reusedRounds = state.rounds.slice(0, groupedTaskIds.length).map((round, index) => ({
        ...round,
        title: `Round ${index + 1}`,
        status: (index === 0 ? 'active' : 'upcoming') as 'active' | 'upcoming',
        durationMinutes: pomodoroLimit,
        taskIds: groupedTaskIds[index],
      }));
      const extraRounds = groupedTaskIds.slice(reusedRounds.length).map((taskIds, index) => ({
        id: crypto.randomUUID(),
        title: `Round ${reusedRounds.length + index + 1}`,
        scheduledTime: '',
        durationMinutes: pomodoroLimit,
        taskIds,
        status: (reusedRounds.length + index === 0 ? 'active' : 'upcoming') as 'active' | 'upcoming',
      }));
      const roundIdsInUse = new Set([...reusedRounds, ...extraRounds].map((round) => round.id));

      return {
        ...state,
        rounds: [...reusedRounds, ...extraRounds],
        tasks: state.tasks.map((task) => {
          if (task.plannedDate !== todayKey) return task;
          const assignedRound = [...reusedRounds, ...extraRounds].find((round) => round.taskIds.includes(task.id));
          return { ...task, roundId: assignedRound?.id };
        }).map((task) => (task.roundId && !roundIdsInUse.has(task.roundId) ? { ...task, roundId: undefined } : task)),
      };
    }
    case 'MOVE_ROUND': {
      const index = state.rounds.findIndex((round) => round.id === action.payload.roundId);
      if (index < 0) return state;
      const targetIndex = action.payload.direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.rounds.length) return state;
      const rounds = [...state.rounds];
      const [moving] = rounds.splice(index, 1);
      rounds.splice(targetIndex, 0, moving);
      const firstOpenRoundId = rounds.find((round) => round.status !== 'done')?.id;
      return {
        ...state,
        rounds: rounds.map((round) =>
          round.status === 'done'
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
    case 'SET_ALARM_TONE':
      return {
        ...state,
        settings: {
          ...state.settings,
          alarmTone: action.payload.tone,
        },
      };
    case 'SET_ALARM_REPEAT_COUNT':
      return {
        ...state,
        settings: {
          ...state.settings,
          alarmRepeatCount: Math.max(1, Math.min(10, Math.round(action.payload.count))),
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
    case 'START_POMODORO': {
      const phase = state.pomodoro.phase;
      const totalSeconds = action.payload.minutes ? action.payload.minutes * 60 : getPhaseSeconds(state, phase);
      const pomodoro: PomodoroState = {
        ...state.pomodoro,
        isRunning: true,
        startedAt: Date.now(),
        totalSeconds,
        remainingSeconds:
          state.pomodoro.activeTaskId === action.payload.taskId && state.pomodoro.phase === 'work'
            ? state.pomodoro.remainingSeconds
            : totalSeconds,
        activeTaskId: phase === 'work' ? action.payload.taskId : state.pomodoro.activeTaskId,
        activeRoundId: phase === 'work' ? action.payload.roundId : state.pomodoro.activeRoundId,
      };
      return { ...state, pomodoro };
    }
    case 'PAUSE_POMODORO':
      return { ...state, pomodoro: { ...state.pomodoro, isRunning: false, startedAt: null } };
    case 'COMPLETE_POMODORO':
      return {
        ...state,
        pomodoro: { ...state.pomodoro, isRunning: false, startedAt: null, remainingSeconds: 0 },
      };
    case 'TICK': {
      if (!state.pomodoro.isRunning || state.pomodoro.remainingSeconds <= 0) return state;
      return {
        ...state,
        pomodoro: { ...state.pomodoro, remainingSeconds: Math.max(0, state.pomodoro.remainingSeconds - 1) },
      };
    }
    case 'RESET_POMODORO': {
      const totalSeconds = getPhaseSeconds(state, state.pomodoro.phase);
      return {
        ...state,
        pomodoro: { ...state.pomodoro, isRunning: false, startedAt: null, totalSeconds, remainingSeconds: totalSeconds },
      };
    }
    case 'ADVANCE_POMODORO_PHASE': {
      const completedWorkSessions =
        state.pomodoro.phase === 'work' ? state.pomodoro.completedWorkSessions + 1 : state.pomodoro.completedWorkSessions;

      const nextPhase: PomodoroState['phase'] =
        state.pomodoro.phase === 'work'
          ? completedWorkSessions % state.settings.sessionsBeforeLongBreak === 0
            ? 'long_break'
            : 'short_break'
          : 'work';
      const totalSeconds = getPhaseSeconds(state, nextPhase);

      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          phase: nextPhase,
          completedWorkSessions,
          isRunning: true,
          startedAt: Date.now(),
          totalSeconds,
          remainingSeconds: totalSeconds,
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
  addTaskFromBank: (taskBankItemId: string) => void;
  updateTask: (task: EditableTask) => void;
  deleteTask: (id: string) => void;
  addTaskBankItem: (task: NewTaskBankItem) => void;
  updateTaskBankItem: (task: EditableTaskBankItem) => void;
  deleteTaskBankItem: (id: string) => void;
  toggleTask: (id: string) => void;
  setUserName: (userName: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  createRound: () => string;
  deleteRound: (roundId: string) => void;
  assignTasksToRound: (roundId: string, taskIds: string[]) => void;
  autoGroupTodayTasks: () => void;
  moveRound: (roundId: string, direction: 'up' | 'down') => void;
  setPomodoroMinutes: (minutes: number) => void;
  setShortBreakMinutes: (minutes: number) => void;
  setLongBreakMinutes: (minutes: number) => void;
  setSessionsBeforeLongBreak: (sessions: number) => void;
  setAlarmTone: (tone: AlarmTone) => void;
  setAlarmRepeatCount: (count: number) => void;
  setShowFirstTimeGuidance: (enabled: boolean) => void;
  startPomodoro: (taskId: string, roundId?: string, minutes?: number) => void;
  pausePomodoro: () => void;
  completePomodoro: () => void;
  resetPomodoro: () => void;
  dismissAlarm: () => void;
  showSuccessMessage: (message: string) => void;
  clearSuccessMessage: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [alarmActive, setAlarmActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const stopAlarmRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    requestNotificationPermissions().catch(() => undefined);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!state.pomodoro.isRunning) return;
    const timer = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.pomodoro.isRunning]);

  useEffect(() => {
    if (state.pomodoro.remainingSeconds !== 0) return;

    const titleByPhase: Record<PomodoroState['phase'], string> = {
      work: 'Focus session complete',
      short_break: 'Short break complete',
      long_break: 'Long break complete',
    };
    const bodyByPhase: Record<PomodoroState['phase'], string> = {
      work: 'Time for a break.',
      short_break: 'Back to focus mode.',
      long_break: 'Great work. Start your next focus session.',
    };

    notifyPomodoroComplete(
      titleByPhase[state.pomodoro.phase],
      bodyByPhase[state.pomodoro.phase],
      state.settings.alarmTone,
      state.settings.alarmRepeatCount,
    ).catch(() => undefined);

    stopAlarmRef.current?.();
    setAlarmActive(true);
    stopAlarmRef.current = startRepeatingAlarm(state.settings.alarmTone, state.settings.alarmRepeatCount, () => {
      stopAlarmRef.current = null;
      setAlarmActive(false);
    });
    dispatch({ type: 'ADVANCE_POMODORO_PHASE' });
  }, [state.pomodoro.remainingSeconds, state.pomodoro.phase, state.settings.alarmTone, state.settings.alarmRepeatCount]);

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

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      alarmActive,
      successMessage,
      addTask: (task) => dispatch({ type: 'ADD_TASK', payload: task }),
      addTaskFromBank: (taskBankItemId) => dispatch({ type: 'ADD_TASK_FROM_BANK', payload: { taskBankItemId } }),
      updateTask: (task) => dispatch({ type: 'UPDATE_TASK', payload: task }),
      deleteTask: (id) => dispatch({ type: 'DELETE_TASK', payload: { id } }),
      addTaskBankItem: (task) => dispatch({ type: 'ADD_TASK_BANK_ITEM', payload: task }),
      updateTaskBankItem: (task) => dispatch({ type: 'UPDATE_TASK_BANK_ITEM', payload: task }),
      deleteTaskBankItem: (id) => dispatch({ type: 'DELETE_TASK_BANK_ITEM', payload: { id } }),
      toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', payload: { id } }),
      setUserName: (userName) => dispatch({ type: 'SET_USER_NAME', payload: { userName } }),
      addCategory: (category) => dispatch({ type: 'ADD_CATEGORY', payload: { category } }),
      deleteCategory: (category) => dispatch({ type: 'DELETE_CATEGORY', payload: { category } }),
      createRound: () => {
        const newRound = buildNewRound(state.rounds, state.settings.pomodoroMinutes);
        dispatch({
          type: 'ADD_ROUND',
          payload: newRound,
        });
        return newRound.id;
      },
      deleteRound: (roundId) => dispatch({ type: 'DELETE_ROUND', payload: { roundId } }),
      assignTasksToRound: (roundId, taskIds) => dispatch({ type: 'ASSIGN_TASKS_TO_ROUND', payload: { roundId, taskIds } }),
      autoGroupTodayTasks: () => dispatch({ type: 'AUTO_GROUP_TODAY_TASKS' }),
      moveRound: (roundId, direction) => dispatch({ type: 'MOVE_ROUND', payload: { roundId, direction } }),
      setPomodoroMinutes: (minutes) => dispatch({ type: 'SET_POMODORO_MINUTES', payload: { minutes } }),
      setShortBreakMinutes: (minutes) => dispatch({ type: 'SET_SHORT_BREAK_MINUTES', payload: { minutes } }),
      setLongBreakMinutes: (minutes) => dispatch({ type: 'SET_LONG_BREAK_MINUTES', payload: { minutes } }),
      setSessionsBeforeLongBreak: (sessions) => dispatch({ type: 'SET_SESSIONS_BEFORE_LONG_BREAK', payload: { sessions } }),
      setAlarmTone: (tone) => dispatch({ type: 'SET_ALARM_TONE', payload: { tone } }),
      setAlarmRepeatCount: (count) => dispatch({ type: 'SET_ALARM_REPEAT_COUNT', payload: { count } }),
      setShowFirstTimeGuidance: (enabled) => dispatch({ type: 'SET_SHOW_FIRST_TIME_GUIDANCE', payload: { enabled } }),
      startPomodoro: (taskId, roundId, minutes) => dispatch({ type: 'START_POMODORO', payload: { taskId, roundId, minutes } }),
      pausePomodoro: () => dispatch({ type: 'PAUSE_POMODORO' }),
      completePomodoro: () => dispatch({ type: 'COMPLETE_POMODORO' }),
      resetPomodoro: () => dispatch({ type: 'RESET_POMODORO' }),
      dismissAlarm,
      showSuccessMessage,
      clearSuccessMessage,
    }),
    [state, alarmActive, successMessage],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return context;
};
