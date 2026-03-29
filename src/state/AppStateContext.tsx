import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { AppState, PomodoroState, Task } from '../types';
import { loadState, saveState } from './storage';
import { notifyPomodoroComplete, playAlarmBell, requestNotificationPermissions } from '../services/notifications';

type Action =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'status'> }
  | { type: 'TOGGLE_TASK'; payload: { id: string } }
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
    case 'START_POMODORO': {
      const totalSeconds = (action.payload.minutes ?? 25) * 60;
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
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  toggleTask: (id: string) => void;
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
      toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', payload: { id } }),
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
