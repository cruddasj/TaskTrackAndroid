import { AppState } from '../types';

const STORAGE_KEY = 'tasktrack.state.v2';
const DEFAULT_POMODORO_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const DEFAULT_SESSIONS_BEFORE_LONG_BREAK = 4;
const DEFAULT_ALARM_REPEAT_COUNT = 3;

const defaultCategories = [
  'Household chores',
  'Health and wellbeing',
  'Work and study',
  'Errands',
  'Personal projects',
  'Uncategorized',
];

const defaultState: AppState = {
  userName: '',
  categories: defaultCategories,
  tasks: [
    {
      id: 't1',
      title: 'Clean kitchen counters',
      description: 'Wipe, disinfect and dry all prep surfaces.',
      category: 'Household chores',
      estimateMinutes: 25,
      status: 'in_progress',
      roundId: 'r1',
    },
    {
      id: 't2',
      title: 'Water indoor ferns',
      description: 'Check moisture and mist leaves.',
      category: 'Health and wellbeing',
      estimateMinutes: 25,
      status: 'todo',
      roundId: 'r1',
    },
  ],
  taskBank: [
    {
      id: 'tb1',
      title: 'Clean kitchen counters',
      description: 'Wipe, disinfect and dry all prep surfaces.',
      category: 'Household chores',
      estimateMinutes: 25,
    },
    {
      id: 'tb2',
      title: 'Water indoor ferns',
      description: 'Check moisture and mist leaves.',
      category: 'Health and wellbeing',
      estimateMinutes: 25,
    },
    {
      id: 'tb3',
      title: 'Sort incoming mail',
      description: 'Separate bills, recycle spam, archive records.',
      category: 'Errands',
      estimateMinutes: 25,
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
      taskIds: [],
      status: 'upcoming',
    },
  ],
  settings: {
    pomodoroMinutes: DEFAULT_POMODORO_MINUTES,
    shortBreakMinutes: DEFAULT_SHORT_BREAK_MINUTES,
    longBreakMinutes: DEFAULT_LONG_BREAK_MINUTES,
    sessionsBeforeLongBreak: DEFAULT_SESSIONS_BEFORE_LONG_BREAK,
    alarmTone: 'bell',
    alarmRepeatCount: DEFAULT_ALARM_REPEAT_COUNT,
  },
  pomodoro: {
    isRunning: false,
    startedAt: null,
    totalSeconds: DEFAULT_POMODORO_MINUTES * 60,
    remainingSeconds: DEFAULT_POMODORO_MINUTES * 60,
    phase: 'work',
    completedWorkSessions: 0,
    activeTaskId: 't1',
    activeRoundId: 'r1',
  },
};

const normalizeState = (raw: Partial<AppState>): AppState => {
  const categories = raw.categories && raw.categories.length > 0 ? raw.categories : defaultCategories;
  const taskBank =
    raw.taskBank ??
    raw.tasks?.map((task) => ({
      id: crypto.randomUUID(),
      title: task.title,
      description: task.description,
      category: task.category,
      estimateMinutes: task.estimateMinutes,
    })) ??
    defaultState.taskBank;
  return {
    ...defaultState,
    ...raw,
    userName: raw.userName ?? '',
    categories,
    tasks: raw.tasks ?? defaultState.tasks,
    taskBank,
    rounds: raw.rounds ?? defaultState.rounds,
    settings: {
      pomodoroMinutes:
        raw.settings?.pomodoroMinutes && raw.settings.pomodoroMinutes > 0
          ? raw.settings.pomodoroMinutes
          : DEFAULT_POMODORO_MINUTES,
      shortBreakMinutes:
        raw.settings?.shortBreakMinutes && raw.settings.shortBreakMinutes > 0
          ? raw.settings.shortBreakMinutes
          : DEFAULT_SHORT_BREAK_MINUTES,
      longBreakMinutes:
        raw.settings?.longBreakMinutes && raw.settings.longBreakMinutes > 0
          ? raw.settings.longBreakMinutes
          : DEFAULT_LONG_BREAK_MINUTES,
      sessionsBeforeLongBreak:
        raw.settings?.sessionsBeforeLongBreak && raw.settings.sessionsBeforeLongBreak > 1
          ? raw.settings.sessionsBeforeLongBreak
          : DEFAULT_SESSIONS_BEFORE_LONG_BREAK,
      alarmTone: raw.settings?.alarmTone ?? 'bell',
      alarmRepeatCount:
        raw.settings?.alarmRepeatCount && raw.settings.alarmRepeatCount > 0
          ? Math.min(10, Math.round(raw.settings.alarmRepeatCount))
          : DEFAULT_ALARM_REPEAT_COUNT,
    },
    pomodoro: {
      ...defaultState.pomodoro,
      ...raw.pomodoro,
    },
  };
};

export const loadState = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return defaultState;
  }
};

export const saveState = (state: AppState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const seedState = defaultState;
