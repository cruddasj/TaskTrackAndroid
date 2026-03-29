export type TabKey = 'dashboard' | 'tasks' | 'rounds' | 'insights'

export type TaskItem = {
  id: string
  title: string
  category: string
  completed: boolean
  estimateMinutes: number
}

export type Round = {
  id: string
  title: string
  startTime: string
  durationMinutes: number
  tasks: string[]
  status: 'active' | 'upcoming' | 'done'
}

export type PomodoroState = {
  running: boolean
  paused: boolean
  totalSeconds: number
  remainingSeconds: number
  activeTaskId: string | null
  startedAt: number | null
}

export type AppState = {
  tasks: TaskItem[]
  rounds: Round[]
  pomodoro: PomodoroState
  selectedTab: TabKey
}
