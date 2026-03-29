import { AppState } from '../types';

const STORAGE_KEY = 'tasktrack.state.v1';

const defaultState: AppState = {
  tasks: [
    {
      id: 't1',
      title: 'Clean kitchen counters',
      description: 'Wipe, disinfect and dry all prep surfaces.',
      category: 'Kitchen',
      estimateMinutes: 25,
      status: 'in_progress',
      roundId: 'r1',
    },
    {
      id: 't2',
      title: 'Water indoor ferns',
      description: 'Check moisture and mist leaves.',
      category: 'Garden',
      estimateMinutes: 25,
      status: 'todo',
      roundId: 'r1',
    },
    {
      id: 't3',
      title: 'Sort incoming mail',
      description: 'Separate bills, recycle spam, archive records.',
      category: 'Admin',
      estimateMinutes: 25,
      status: 'todo',
      roundId: 'r2',
    },
  ],
  rounds: [
    {
      id: 'r1',
      title: 'Round 1',
      scheduledTime: '08:30 AM',
      durationMinutes: 25,
      taskIds: ['t1', 't2'],
      status: 'active',
    },
    {
      id: 'r2',
      title: 'Round 2',
      scheduledTime: '09:05 AM',
      durationMinutes: 25,
      taskIds: ['t3'],
      status: 'upcoming',
    },
  ],
  pomodoro: {
    isRunning: false,
    startedAt: null,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    activeTaskId: 't1',
    activeRoundId: 'r1',
  },
};

export const loadState = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return defaultState;
  }
};

export const saveState = (state: AppState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const seedState = defaultState;
