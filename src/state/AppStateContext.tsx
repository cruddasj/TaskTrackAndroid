import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { AppState, PomodoroState, Task, TaskBankItem } from '../types';
import { loadState, saveState } from './storage';
import { notifyPomodoroComplete, playAlarmBell, requestNotificationPermissions } from '../services/notifications';

type NewTask = Omit<Task, 'id' | 'status'>;
type EditableTask = Omit<Task, 'status'>;
type NewTaskBankItem = Omit<TaskBankItem, 'id'>;
type EditableTaskBankItem = TaskBankItem;

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
  | { type: 'ASSIGN_TASKS_TO_ROUND'; payload: { roundId: string; taskIds: string[] } }
  | { type: 'SET_POMODORO_MINUTES'; payload: { minutes: number } }
  | { type: 'START_POMODORO'; payload: { taskId: string; roundId?: string; minutes?: number } }
  | { type: 'PAUSE_POMODORO' }
  | { type: 'TICK' }
  | { type: 'RESET_POMODORO' };

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
          },
        ],
      };
    }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.id) return task;
          return {
            ...task,
            ...action.payload,
          };
        }),
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
        tasks: [
          ...state.tasks,
          {
            ...sourceTask,
            id: crypto.randomUUID(),
            status: 'todo',
          },
        ],
      };
    }
    case 'ADD_TASK_BANK_ITEM': {
      const id = crypto.randomUUID();
      return {
        ...state,
        taskBank: [...state.taskBank, { ...action.payload, id }],
      };
    }
    case 'UPDATE_TASK_BANK_ITEM':
      return {
        ...state,
        taskBank: state.taskBank.map((task) => {
          if (task.id !== action.payload.id) return task;
          return {
            ...task,
            ...action.payload,
          };
        }),
      };
    case 'DELETE_TASK_BANK_ITEM':
      return {
        ...state,
        taskBank: state.taskBank.filter((task) => task.id !== action.payload.id),
      };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.id) return task;
          return {
            ...task,
            status: task.status === 'done' ? 'todo' : 'done',
          };
        }),
      };
    case 'SET_USER_NAME':
      return {
        ...state,
        userName: action.payload.userName,
      };
    case 'ADD_CATEGORY': {
      if (state.categories.includes(action.payload.category)) return state;
      return {
        ...state,
        categories: [...state.categories, action.payload.category],
      };
    }
    case 'DELETE_CATEGORY': {
      const category = action.payload.category;
      if (state.categories.length <= 1) return state;
      const nextCategories = state.categories.filter((item) => item !== category);
      const fallbackCategory = nextCategories[0] ?? 'Uncategorized';
      return {
        ...state,
        categories: nextCategories,
        tasks: state.tasks.map((task) =>
          task.category === category
            ? {
                ...task,
                category: fallbackCategory,
              }
            : task,
        ),
      };
    }
    case 'ASSIGN_TASKS_TO_ROUND': {
      const { roundId, taskIds } = action.payload;
      const taskIdSet = new Set(taskIds);
      return {
        ...state,
        rounds: state.rounds.map((round) =>
          round.id === roundId
            ? {
                ...round,
                taskIds,
              }
            : {
                ...round,
                taskIds: round.taskIds.filter((taskId) => !taskIdSet.has(taskId)),
              },
        ),
        tasks: state.tasks.map((task) => {
          if (taskIdSet.has(task.id)) {
            return { ...task, roundId };
          }
          if (task.roundId === roundId) {
            return { ...task, roundId: undefined };
          }
          return task;
        }),
      };
    }
    case 'SET_POMODORO_MINUTES': {
      const minutes = Math.max(1, Math.round(action.payload.minutes));
      return {
        ...state,
        settings: {
          ...state.settings,
          pomodoroMinutes: minutes,
        },
        rounds: state.rounds.map((round) => ({
          ...round,
          durationMinutes: minutes,
        })),
        pomodoro: {
          ...state.pomodoro,
          totalSeconds: minutes * 60,
          remainingSeconds: state.pomodoro.isRunning ? state.pomodoro.remainingSeconds : minutes * 60,
        },
      };
    }
    case 'START_POMODORO': {
      const totalSeconds = (action.payload.minutes ?? state.settings.pomodoroMinutes) * 60;
      const pomodoro: PomodoroState = {
        ...state.pomodoro,
        isRunning: true,
        startedAt: Date.now(),
        totalSeconds,
        remainingSeconds:
          state.pomodoro.activeTaskId === action.payload.taskId ? state.pomodoro.remainingSeconds : totalSeconds,
        activeTaskId: action.payload.taskId,
        activeRoundId: action.payload.roundId,
      };
      return { ...state, pomodoro };
    }
    case 'PAUSE_POMODORO':
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          isRunning: false,
          startedAt: null,
        },
      };
    case 'TICK': {
      if (!state.pomodoro.isRunning || state.pomodoro.remainingSeconds <= 0) return state;
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          remainingSeconds: Math.max(0, state.pomodoro.remainingSeconds - 1),
        },
      };
    }
    case 'RESET_POMODORO':
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          isRunning: false,
          startedAt: null,
          remainingSeconds: state.pomodoro.totalSeconds,
        },
      };
    default:
      return state;
  }
};

interface AppStateContextValue {
  state: AppState;
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
  assignTasksToRound: (roundId: string, taskIds: string[]) => void;
  setPomodoroMinutes: (minutes: number) => void;
  startPomodoro: (taskId: string, roundId?: string, minutes?: number) => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

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

    const activeTask = state.tasks.find((task) => task.id === state.pomodoro.activeTaskId);
    const taskTitle = activeTask?.title ?? 'Current task';

    notifyPomodoroComplete(taskTitle).catch(() => undefined);
    playAlarmBell();
    dispatch({ type: 'PAUSE_POMODORO' });
  }, [state.pomodoro.remainingSeconds, state.pomodoro.activeTaskId, state.tasks]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
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
      assignTasksToRound: (roundId, taskIds) => dispatch({ type: 'ASSIGN_TASKS_TO_ROUND', payload: { roundId, taskIds } }),
      setPomodoroMinutes: (minutes) => dispatch({ type: 'SET_POMODORO_MINUTES', payload: { minutes } }),
      startPomodoro: (taskId, roundId, minutes) => dispatch({ type: 'START_POMODORO', payload: { taskId, roundId, minutes } }),
      pausePomodoro: () => dispatch({ type: 'PAUSE_POMODORO' }),
      resetPomodoro: () => dispatch({ type: 'RESET_POMODORO' }),
    }),
    [state],
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
