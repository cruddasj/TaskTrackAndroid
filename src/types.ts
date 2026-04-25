import { AlarmTone } from './constants/alarmTones';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type RoundPlacementPreference = 'early' | 'late';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  estimateMinutes: number;
  status: TaskStatus;
  plannedDate: string;
  completedAt?: string;
  roundId?: string;
  previousRoundIds?: string[];
  roundPlacementPreference?: RoundPlacementPreference;
  sourceTaskBankItemId?: string;
  prerequisiteTaskIds?: string[];
}


export interface TaskBankItem {
  id: string;
  title: string;
  description: string;
  category: string;
  estimateMinutes: number;
  lastCompletedOn?: string;
  recurrenceDays?: number;
  recurrenceWeekdays?: number[];
  recurrenceDayOfMonth?: number;
  roundPlacementPreference?: RoundPlacementPreference;
  prerequisiteTaskBankItemIds?: string[];
}


export interface Round {
  id: string;
  title: string;
  plannedDate?: string;
  scheduledTime: string;
  durationMinutes: number;
  taskIds: string[];
  status: 'active' | 'upcoming' | 'done';
}

export interface PomodoroState {
  sessionId: number | null;
  startTime: number | null;
  duration: number;
  remaining: number | null;
  isPaused: boolean;
  isRunning: boolean;
  startedAt: number | null;
  remainingSeconds: number;
  totalSeconds: number;
  phase: 'work' | 'short_break' | 'long_break';
  completedWorkSessions: number;
  lastResetDateKey?: string;
  activeTaskId?: string;
  activeRoundId?: string;
}

export interface AppState {
  userName: string;
  categories: string[];
  tasks: Task[];
  taskBank: TaskBankItem[];
  rounds: Round[];
  settings: {
    pomodoroMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    debugModeEnabled: boolean;
    debugPomodoroSeconds: number;
    debugShortBreakSeconds: number;
    debugLongBreakSeconds: number;
    sessionsBeforeLongBreak: number;
    sessionReviewGraceSeconds: number;
    alarmTone: AlarmTone;
    alarmVolume: number;
    recurringSuggestionCooldownEnabled: boolean;
    recurringSuggestionCooldownDays: number;
    showFirstTimeGuidance: boolean;
    hasSeenWelcomeModal: boolean;
  };
  pomodoro: PomodoroState;
}
