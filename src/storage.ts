import type { AppState } from './types'

const STORAGE_KEY = 'tasktrack_state_v1'

export const defaultState: AppState = {
  selectedTab: 'dashboard',
  tasks: [
    { id: 't1', title: 'Clean kitchen counters', category: 'Kitchen', completed: false, estimateMinutes: 25 },
    { id: 't2', title: 'Water indoor ferns', category: 'Garden', completed: false, estimateMinutes: 10 },
    { id: 't3', title: 'Sort incoming mail', category: 'Admin', completed: false, estimateMinutes: 20 },
    { id: 't4', title: 'Reset coffee station', category: 'Kitchen', completed: false, estimateMinutes: 15 }
  ],
  rounds: [
    { id: 'r1', title: 'Round 1', startTime: '08:30 AM', durationMinutes: 25, tasks: ['t1', 't2'], status: 'active' },
    { id: 'r2', title: 'Round 2', startTime: '09:05 AM', durationMinutes: 25, tasks: ['t3', 't4'], status: 'upcoming' },
    { id: 'r3', title: 'Round 3', startTime: '09:40 AM', durationMinutes: 25, tasks: [], status: 'upcoming' }
  ],
  pomodoro: {
    running: false,
    paused: false,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    activeTaskId: 't1',
    startedAt: null
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as AppState
    return {
      ...defaultState,
      ...parsed,
      pomodoro: { ...defaultState.pomodoro, ...parsed.pomodoro }
    }
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
