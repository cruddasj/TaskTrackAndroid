export type TaskStatus = 'todo' | 'in_progress' | 'done';

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
}

export interface TaskBankItem {
  id: string;
  title: string;
  description: string;
  category: string;
  estimateMinutes: number;
  recurrenceDays?: number;
  recurrenceWeekdays?: number[];
}

export interface Round {
  id: string;
  title: string;
  plannedDate: string;
  scheduledTime: string;
  durationMinutes: number;
  taskIds: string[];
  status: 'active' | 'upcoming' | 'done';
}

export interface PomodoroState {
  isRunning: boolean;
  startedAt: number | null;
  remainingSeconds: number;
  totalSeconds: number;
  phase: 'work' | 'short_break' | 'long_break';
  completedWorkSessions: number;
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
    sessionsBeforeLongBreak: number;
    sessionReviewGraceSeconds: number;
    alarmTone: 'bell' | 'chime' | 'digital' | 'gentle' | 'pulse';
    alarmVolume: number;
    alarmRepeatCount: number;
    showFirstTimeGuidance: boolean;
  };
  pomodoro: PomodoroState;
}
