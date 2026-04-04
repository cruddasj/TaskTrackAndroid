import { clearStoredState, createDemoState, loadState, saveState, seedState } from './storage';
import { getTodayKey } from '../utils';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty seed state when local storage is empty', () => {
    const loaded = loadState();

    expect(loaded).toEqual(seedState);
    expect(loaded.tasks).toEqual([]);
    expect(loaded.rounds).toEqual([]);
    expect(loaded.taskBank).toEqual([]);
  });

  it('saves and loads state with alarm repeat count and volume', () => {
    const updated = {
      ...seedState,
      settings: {
        ...seedState.settings,
        alarmVolume: 45,
        alarmRepeatCount: 5,
        sessionReviewGraceSeconds: 90,
        showFirstTimeGuidance: false,
        hasSeenWelcomeModal: true,
      },
    };

    saveState(updated);

    expect(loadState().settings.alarmVolume).toBe(45);
    expect(loadState().settings.alarmRepeatCount).toBe(5);
    expect(loadState().settings.sessionReviewGraceSeconds).toBe(90);
    expect(loadState().settings.showFirstTimeGuidance).toBe(false);
    expect(loadState().settings.hasSeenWelcomeModal).toBe(true);
  });

  it('clears persisted app state from localStorage', () => {
    saveState(seedState);
    expect(localStorage.getItem('tasktrack.state.v2')).not.toBeNull();

    clearStoredState();

    expect(localStorage.getItem('tasktrack.state.v2')).toBeNull();
  });

  it('normalizes invalid alarm repeat counts to defaults and caps oversized values', () => {
    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          alarmRepeatCount: 0,
        },
      }),
    );

    expect(loadState().settings.alarmRepeatCount).toBe(3);

    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          alarmRepeatCount: 33,
        },
      }),
    );

    expect(loadState().settings.alarmRepeatCount).toBe(10);
  });

  it('normalizes invalid alarm volumes to defaults and caps oversized values', () => {
    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          alarmVolume: -1,
        },
      }),
    );

    expect(loadState().settings.alarmVolume).toBe(0);

    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          alarmVolume: 333,
        },
      }),
    );

    expect(loadState().settings.alarmVolume).toBe(100);
  });

  it('normalizes legacy and invalid alarm tone values', () => {
    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          alarmTone: 'chime',
        },
      }),
    );

    expect(loadState().settings.alarmTone).toBe('chirp');

    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          alarmTone: 'not-a-tone',
        },
      }),
    );

    expect(loadState().settings.alarmTone).toBe('clock_bell');
  });

  it('defaults first-time guidance setting to true when missing from persisted state', () => {
    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          pomodoroMinutes: 30,
        },
      }),
    );

    expect(loadState().settings.showFirstTimeGuidance).toBe(true);
    expect(loadState().settings.hasSeenWelcomeModal).toBe(false);
  });

  it('normalizes invalid session review timeout values', () => {
    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          sessionReviewGraceSeconds: 0,
        },
      }),
    );

    expect(loadState().settings.sessionReviewGraceSeconds).toBe(60);

    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        settings: {
          sessionReviewGraceSeconds: 9999,
        },
      }),
    );

    expect(loadState().settings.sessionReviewGraceSeconds).toBe(600);
  });

  it('falls back to defaults if persisted JSON is invalid', () => {
    localStorage.setItem('tasktrack.state.v2', '{bad-json');

    expect(loadState()).toEqual(seedState);
  });

  it('adds plannedDate when loading older persisted tasks', () => {
    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        tasks: [
          {
            id: 'legacy-1',
            title: 'Legacy task',
            description: 'Migrated',
            category: 'Uncategorized',
            estimateMinutes: 25,
            status: 'todo',
          },
        ],
      }),
    );

    expect(loadState().tasks[0].plannedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('normalizes invalid task bank recurrence values', () => {
    localStorage.setItem(
      'tasktrack.state.v2',
      JSON.stringify({
        taskBank: [
          {
            id: 'tb-1',
            title: 'Make bread',
            description: 'Bake',
            category: 'Household chores',
            estimateMinutes: 45,
            recurrenceDays: 0,
            recurrenceDayOfMonth: 0,
          },
          {
            id: 'tb-2',
            title: 'Water plants',
            description: 'Mist',
            category: 'Health and wellbeing',
            estimateMinutes: 10,
            recurrenceDays: 2.7,
            recurrenceWeekdays: [2, 2, 7, -1],
            recurrenceDayOfMonth: 15.2,
          },
        ],
      }),
    );

    const loaded = loadState();
    expect(loaded.taskBank[0].recurrenceDays).toBeUndefined();
    expect(loaded.taskBank[0].recurrenceDayOfMonth).toBeUndefined();
    expect(loaded.taskBank[1].recurrenceDays).toBe(3);
    expect(loaded.taskBank[1].recurrenceWeekdays).toEqual([2]);
    expect(loaded.taskBank[1].recurrenceDayOfMonth).toBe(15);
  });

  it('creates demo data with historical completed tasks', () => {
    const demoState = createDemoState(seedState);
    const todayKey = getTodayKey();

    expect(demoState.tasks.length).toBeGreaterThan(3);
    expect(demoState.rounds.length).toBeGreaterThan(0);
    expect(demoState.taskBank.length).toBeGreaterThan(0);
    expect(demoState.tasks.some((task) => task.status === 'done' && task.completedAt && task.plannedDate < todayKey)).toBe(true);
    expect(demoState.tasks.some((task) => task.plannedDate === todayKey)).toBe(true);
  });
});
