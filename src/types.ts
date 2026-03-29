export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  estimateMinutes: number;
  status: TaskStatus;
  roundId?: string;
}

export interface Round {
  id: string;
  title: string;
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
  activeTaskId?: string;
  activeRoundId?: string;
}

export interface AppState {
  userName: string;
  categories: string[];
  tasks: Task[];
  rounds: Round[];
  pomodoro: PomodoroState;
}
