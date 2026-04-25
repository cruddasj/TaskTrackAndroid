import { AppState } from '../types';
import { DEFAULT_ALARM_TONE, normalizeAlarmTone } from '../constants/alarmTones';
import { normalizeRecurrenceWeekdays } from './tasks';
import { normalizeDependencyIds } from './taskDependencies';
import { getDateKeyWithOffset } from '../utils';

const STORAGE_KEY = 'tasktrack.state.v2';
const DEFAULT_POMODORO_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const DEFAULT_DEBUG_MODE_ENABLED = false;
const DEFAULT_DEBUG_POMODORO_SECONDS = DEFAULT_POMODORO_MINUTES * 60;
const DEFAULT_DEBUG_SHORT_BREAK_SECONDS = DEFAULT_SHORT_BREAK_MINUTES * 60;
const DEFAULT_DEBUG_LONG_BREAK_SECONDS = DEFAULT_LONG_BREAK_MINUTES * 60;
const DEFAULT_SESSIONS_BEFORE_LONG_BREAK = 4;
const DEFAULT_SESSION_REVIEW_GRACE_SECONDS = 60;
const DEFAULT_ALARM_VOLUME = 70;
const DEFAULT_RECURRING_SUGGESTION_COOLDOWN_ENABLED = false;
const DEFAULT_RECURRING_SUGGESTION_COOLDOWN_DAYS = 3;
const DEFAULT_SHOW_FIRST_TIME_GUIDANCE = true;
const DEFAULT_HAS_SEEN_WELCOME_MODAL = false;
const getDateKey = (daysAgo = 0): string => getDateKeyWithOffset(-daysAgo);
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
    debugModeEnabled: DEFAULT_DEBUG_MODE_ENABLED,
    debugPomodoroSeconds: DEFAULT_DEBUG_POMODORO_SECONDS,
    debugShortBreakSeconds: DEFAULT_DEBUG_SHORT_BREAK_SECONDS,
    debugLongBreakSeconds: DEFAULT_DEBUG_LONG_BREAK_SECONDS,
    sessionsBeforeLongBreak: DEFAULT_SESSIONS_BEFORE_LONG_BREAK,
    sessionReviewGraceSeconds: DEFAULT_SESSION_REVIEW_GRACE_SECONDS,
    alarmTone: DEFAULT_ALARM_TONE,
    alarmVolume: DEFAULT_ALARM_VOLUME,
    recurringSuggestionCooldownEnabled: DEFAULT_RECURRING_SUGGESTION_COOLDOWN_ENABLED,
    recurringSuggestionCooldownDays: DEFAULT_RECURRING_SUGGESTION_COOLDOWN_DAYS,
    showFirstTimeGuidance: DEFAULT_SHOW_FIRST_TIME_GUIDANCE,
    hasSeenWelcomeModal: DEFAULT_HAS_SEEN_WELCOME_MODAL,
  },
  pomodoro: {
    sessionId: null,
    startTime: null,
    duration: DEFAULT_POMODORO_MINUTES * 60 * 1000,
    remaining: null,
    isPaused: false,
    isRunning: false,
    startedAt: null,
    totalSeconds: DEFAULT_POMODORO_MINUTES * 60,
    remainingSeconds: DEFAULT_POMODORO_MINUTES * 60,
    phase: 'work',
    completedWorkSessions: 0,
    lastResetDateKey: getDateKey(),
    activeTaskId: undefined,
    activeRoundId: undefined,
  },
};

const getWorkPhaseResetSeconds = (state: Pick<AppState, 'settings'>): number => (
  state.settings.debugModeEnabled ? state.settings.debugPomodoroSeconds : state.settings.pomodoroMinutes * 60
);

const normalizeRoundPlacementPreference = (value: unknown): 'early' | 'late' | undefined => (
  value === 'early' || value === 'late' ? value : undefined
);

const normalizePomodoroForDay = (state: AppState): AppState['pomodoro'] => {
  const todayKey = getDateKey();
  const totalSeconds = getWorkPhaseResetSeconds(state);
  const baselinePomodoro = {
    ...state.pomodoro,
    lastResetDateKey: state.pomodoro.lastResetDateKey ?? todayKey,
  };

  if (baselinePomodoro.lastResetDateKey === todayKey) {
    return baselinePomodoro;
  }

  return {
    ...baselinePomodoro,
    sessionId: null,
    startTime: null,
    duration: totalSeconds * 1000,
    remaining: null,
    isPaused: false,
    isRunning: false,
    startedAt: null,
    totalSeconds,
    remainingSeconds: totalSeconds,
    phase: 'work',
    completedWorkSessions: 0,
    activeTaskId: undefined,
    activeRoundId: undefined,
    lastResetDateKey: todayKey,
  };
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
        plannedDate: todayKey,
        scheduledTime: '09:00 AM',
        durationMinutes: state.settings.pomodoroMinutes,
        taskIds: tasks.reduce<string[]>((acc, task) => {
          if (task.roundId === todayRound1Id) acc.push(task.id);
          return acc;
        }, []),
        status: 'active',
      },
      {
        id: todayRound2Id,
        title: 'Round 2',
        plannedDate: todayKey,
        scheduledTime: '10:00 AM',
        durationMinutes: state.settings.pomodoroMinutes,
        taskIds: tasks.reduce<string[]>((acc, task) => {
          if (task.roundId === todayRound2Id) acc.push(task.id);
          return acc;
        }, []),
        status: 'upcoming',
      },
    ],
    pomodoro: {
      ...state.pomodoro,
      sessionId: null,
      startTime: null,
      duration: state.settings.pomodoroMinutes * 60 * 1000,
      remaining: null,
      isPaused: false,
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

export const normalizeState = (raw: Partial<AppState>): AppState => {
  const normalizedTodayKey = getDateKey();
  const categories = raw.categories && raw.categories.length > 0 ? raw.categories : defaultCategories;
  const taskBank =
    raw.taskBank ??
    raw.tasks?.map((task) => ({
      id: crypto.randomUUID(),
      title: task.title,
      description: task.description,
      category: task.category,
      estimateMinutes: task.estimateMinutes,
      lastCompletedOn: undefined,
      recurrenceDays: undefined,
      recurrenceWeekdays: undefined,
      recurrenceDayOfMonth: undefined,
      roundPlacementPreference: normalizeRoundPlacementPreference(task.roundPlacementPreference),
      prerequisiteTaskBankItemIds: undefined,
    })) ??
    defaultState.taskBank;
  const normalizedState: AppState = {
    ...defaultState,
    ...raw,
    userName: raw.userName ?? '',
    categories,
    tasks:
      raw.tasks?.map((task) => ({
        ...task,
        plannedDate: task.plannedDate ?? getDateKey(),
        roundPlacementPreference: normalizeRoundPlacementPreference(task.roundPlacementPreference),
        prerequisiteTaskIds: normalizeDependencyIds(task.prerequisiteTaskIds),
      })) ?? defaultState.tasks,
    taskBank: taskBank.map((item) => ({
      ...item,
      recurrenceDays:
        item.recurrenceDays && item.recurrenceDays > 0
          ? Math.round(item.recurrenceDays)
          : undefined,
      lastCompletedOn:
        typeof item.lastCompletedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.lastCompletedOn)
          ? item.lastCompletedOn
          : undefined,
      recurrenceWeekdays:
        normalizeRecurrenceWeekdays(item.recurrenceWeekdays),
      recurrenceDayOfMonth:
        typeof item.recurrenceDayOfMonth === 'number' && Number.isFinite(item.recurrenceDayOfMonth)
          && Math.round(item.recurrenceDayOfMonth) >= 1
          && Math.round(item.recurrenceDayOfMonth) <= 31
          ? Math.round(item.recurrenceDayOfMonth)
          : undefined,
      roundPlacementPreference: normalizeRoundPlacementPreference(item.roundPlacementPreference),
      prerequisiteTaskBankItemIds: normalizeDependencyIds(item.prerequisiteTaskBankItemIds),
    })),
    rounds: raw.rounds?.map((round) => ({
      ...round,
      plannedDate: round.plannedDate ?? normalizedTodayKey,
    })) ?? defaultState.rounds,
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
      debugModeEnabled: raw.settings?.debugModeEnabled ?? DEFAULT_DEBUG_MODE_ENABLED,
      debugPomodoroSeconds:
        raw.settings?.debugPomodoroSeconds && raw.settings.debugPomodoroSeconds > 0
          ? Math.round(raw.settings.debugPomodoroSeconds)
          : DEFAULT_DEBUG_POMODORO_SECONDS,
      debugShortBreakSeconds:
        raw.settings?.debugShortBreakSeconds && raw.settings.debugShortBreakSeconds > 0
          ? Math.round(raw.settings.debugShortBreakSeconds)
          : DEFAULT_DEBUG_SHORT_BREAK_SECONDS,
      debugLongBreakSeconds:
        raw.settings?.debugLongBreakSeconds && raw.settings.debugLongBreakSeconds > 0
          ? Math.round(raw.settings.debugLongBreakSeconds)
          : DEFAULT_DEBUG_LONG_BREAK_SECONDS,
      sessionsBeforeLongBreak:
        raw.settings?.sessionsBeforeLongBreak && raw.settings.sessionsBeforeLongBreak > 1
          ? raw.settings.sessionsBeforeLongBreak
          : DEFAULT_SESSIONS_BEFORE_LONG_BREAK,
      sessionReviewGraceSeconds:
        raw.settings?.sessionReviewGraceSeconds && raw.settings.sessionReviewGraceSeconds > 0
          ? Math.min(600, Math.round(raw.settings.sessionReviewGraceSeconds))
          : DEFAULT_SESSION_REVIEW_GRACE_SECONDS,
      alarmTone: normalizeAlarmTone(raw.settings?.alarmTone),
      alarmVolume:
        typeof raw.settings?.alarmVolume === 'number'
          ? Math.max(0, Math.min(100, Math.round(raw.settings.alarmVolume)))
          : DEFAULT_ALARM_VOLUME,
      recurringSuggestionCooldownEnabled:
        raw.settings?.recurringSuggestionCooldownEnabled ?? DEFAULT_RECURRING_SUGGESTION_COOLDOWN_ENABLED,
      recurringSuggestionCooldownDays:
        raw.settings?.recurringSuggestionCooldownDays && raw.settings.recurringSuggestionCooldownDays > 0
          ? Math.round(raw.settings.recurringSuggestionCooldownDays)
          : DEFAULT_RECURRING_SUGGESTION_COOLDOWN_DAYS,
      showFirstTimeGuidance: raw.settings?.showFirstTimeGuidance ?? DEFAULT_SHOW_FIRST_TIME_GUIDANCE,
      hasSeenWelcomeModal: raw.settings?.hasSeenWelcomeModal ?? DEFAULT_HAS_SEEN_WELCOME_MODAL,
    },
    pomodoro: {
      ...defaultState.pomodoro,
      ...raw.pomodoro,
    },
  };

  return {
    ...normalizedState,
    pomodoro: normalizePomodoroForDay(normalizedState),
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

export const clearStoredState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const seedState = defaultState;
