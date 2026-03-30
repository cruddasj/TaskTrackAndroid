import { AppState } from '../types';

const STORAGE_KEY = 'tasktrack.state.v2';
const DEFAULT_POMODORO_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const DEFAULT_SESSIONS_BEFORE_LONG_BREAK = 4;
const DEFAULT_SESSION_REVIEW_GRACE_SECONDS = 60;
const DEFAULT_ALARM_REPEAT_COUNT = 3;
const DEFAULT_SHOW_FIRST_TIME_GUIDANCE = true;
const getDateKey = (daysAgo = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};
const getCompletedAtIso = (daysAgo: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

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
  tasks: [],
  taskBank: [],
  rounds: [],
  settings: {
    pomodoroMinutes: DEFAULT_POMODORO_MINUTES,
    shortBreakMinutes: DEFAULT_SHORT_BREAK_MINUTES,
    longBreakMinutes: DEFAULT_LONG_BREAK_MINUTES,
    sessionsBeforeLongBreak: DEFAULT_SESSIONS_BEFORE_LONG_BREAK,
    sessionReviewGraceSeconds: DEFAULT_SESSION_REVIEW_GRACE_SECONDS,
    alarmTone: 'bell',
    alarmRepeatCount: DEFAULT_ALARM_REPEAT_COUNT,
    showFirstTimeGuidance: DEFAULT_SHOW_FIRST_TIME_GUIDANCE,
  },
  pomodoro: {
    isRunning: false,
    startedAt: null,
    totalSeconds: DEFAULT_POMODORO_MINUTES * 60,
    remainingSeconds: DEFAULT_POMODORO_MINUTES * 60,
    phase: 'work',
    completedWorkSessions: 0,
    activeTaskId: undefined,
    activeRoundId: undefined,
  },
};

export const createDemoState = (state: AppState): AppState => {
  const todayKey = getDateKey();
  const yesterdayKey = getDateKey(1);
  const twoDaysAgoKey = getDateKey(2);
  const sixDaysAgoKey = getDateKey(6);

  const todayRound1Id = crypto.randomUUID();
  const todayRound2Id = crypto.randomUUID();

  const tasks = [
    {
      id: crypto.randomUUID(),
      title: 'Review sprint priorities',
      description: 'Confirm top 3 tasks for today.',
      category: 'Work and study',
      estimateMinutes: 25,
      status: 'in_progress' as const,
      plannedDate: todayKey,
      roundId: todayRound1Id,
    },
    {
      id: crypto.randomUUID(),
      title: 'Plan grocery list',
      description: 'List meals and missing ingredients.',
      category: 'Errands',
      estimateMinutes: 20,
      status: 'todo' as const,
      plannedDate: todayKey,
      roundId: todayRound2Id,
    },
    {
      id: crypto.randomUUID(),
      title: 'Morning mobility routine',
      description: '10-minute stretch and breathing exercises.',
      category: 'Health and wellbeing',
      estimateMinutes: 15,
      status: 'done' as const,
      plannedDate: yesterdayKey,
      completedAt: getCompletedAtIso(1, 9),
    },
    {
      id: crypto.randomUUID(),
      title: 'Desk reset',
      description: 'Clear clutter and prepare tomorrow notes.',
      category: 'Household chores',
      estimateMinutes: 15,
      status: 'done' as const,
      plannedDate: twoDaysAgoKey,
      completedAt: getCompletedAtIso(2, 18),
    },
    {
      id: crypto.randomUUID(),
      title: 'Prototype app icon ideas',
      description: 'Sketch and compare three icon options.',
      category: 'Personal projects',
      estimateMinutes: 30,
      status: 'done' as const,
      plannedDate: sixDaysAgoKey,
      completedAt: getCompletedAtIso(6, 20),
    },
  ];

  return {
    ...state,
    categories: [...defaultCategories],
    tasks,
    taskBank: [
      {
        id: crypto.randomUUID(),
        title: 'Weekly budget check',
        description: 'Review expenses and upcoming bills.',
        category: 'Errands',
        estimateMinutes: 25,
        recurrenceDays: 7,
      },
      {
        id: crypto.randomUUID(),
        title: 'Read for skill growth',
        description: 'Read one chapter and capture notes.',
        category: 'Work and study',
        estimateMinutes: 30,
        recurrenceDays: 2,
      },
      {
        id: crypto.randomUUID(),
        title: 'Deep clean kitchen',
        description: 'Counters, sink, and stove top.',
        category: 'Household chores',
        estimateMinutes: 30,
        recurrenceWeekdays: [6],
      },
    ],
    rounds: [
      {
        id: todayRound1Id,
        title: 'Round 1',
        scheduledTime: '09:00 AM',
        durationMinutes: state.settings.pomodoroMinutes,
        taskIds: tasks.filter((task) => task.roundId === todayRound1Id).map((task) => task.id),
        status: 'active',
      },
      {
        id: todayRound2Id,
        title: 'Round 2',
        scheduledTime: '10:00 AM',
        durationMinutes: state.settings.pomodoroMinutes,
        taskIds: tasks.filter((task) => task.roundId === todayRound2Id).map((task) => task.id),
        status: 'upcoming',
      },
    ],
    pomodoro: {
      ...state.pomodoro,
      isRunning: false,
      startedAt: null,
      totalSeconds: state.settings.pomodoroMinutes * 60,
      remainingSeconds: state.settings.pomodoroMinutes * 60,
      phase: 'work',
      completedWorkSessions: 2,
      activeTaskId: tasks.find((task) => task.roundId === todayRound1Id)?.id,
      activeRoundId: todayRound1Id,
    },
  };
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
      recurrenceDays: undefined,
      recurrenceWeekdays: undefined,
    })) ??
    defaultState.taskBank;
  return {
    ...defaultState,
    ...raw,
    userName: raw.userName ?? '',
    categories,
    tasks:
      raw.tasks?.map((task) => ({
        ...task,
        plannedDate: task.plannedDate ?? getDateKey(),
      })) ?? defaultState.tasks,
    taskBank: taskBank.map((item) => ({
      ...item,
      recurrenceDays:
        item.recurrenceDays && item.recurrenceDays > 0
          ? Math.round(item.recurrenceDays)
          : undefined,
      recurrenceWeekdays:
        item.recurrenceWeekdays && item.recurrenceWeekdays.length > 0
          ? [...new Set(item.recurrenceWeekdays)]
            .filter((weekday): weekday is number => typeof weekday === 'number' && Number.isInteger(weekday) && weekday >= 0 && weekday <= 6)
            .sort((a, b) => a - b)
          : undefined,
    })),
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
      sessionReviewGraceSeconds:
        raw.settings?.sessionReviewGraceSeconds && raw.settings.sessionReviewGraceSeconds > 0
          ? Math.min(600, Math.round(raw.settings.sessionReviewGraceSeconds))
          : DEFAULT_SESSION_REVIEW_GRACE_SECONDS,
      alarmTone: raw.settings?.alarmTone ?? 'bell',
      alarmRepeatCount:
        raw.settings?.alarmRepeatCount && raw.settings.alarmRepeatCount > 0
          ? Math.min(10, Math.round(raw.settings.alarmRepeatCount))
          : DEFAULT_ALARM_REPEAT_COUNT,
      showFirstTimeGuidance: raw.settings?.showFirstTimeGuidance ?? DEFAULT_SHOW_FIRST_TIME_GUIDANCE,
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
