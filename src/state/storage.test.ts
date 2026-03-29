import { createDemoState, loadState, saveState, seedState } from './storage';

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

  it('saves and loads state with alarm repeat count', () => {
    const updated = {
      ...seedState,
      settings: {
        ...seedState.settings,
        alarmRepeatCount: 5,
        showFirstTimeGuidance: false,
      },
    };

    saveState(updated);

    expect(loadState().settings.alarmRepeatCount).toBe(5);
    expect(loadState().settings.showFirstTimeGuidance).toBe(false);
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
          },
          {
            id: 'tb-2',
            title: 'Water plants',
            description: 'Mist',
            category: 'Health and wellbeing',
            estimateMinutes: 10,
            recurrenceDays: 2.7,
            recurrenceWeekdays: [2, 2, 7, -1],
          },
        ],
      }),
    );

    const loaded = loadState();
    expect(loaded.taskBank[0].recurrenceDays).toBeUndefined();
    expect(loaded.taskBank[1].recurrenceDays).toBe(3);
    expect(loaded.taskBank[1].recurrenceWeekdays).toEqual([2]);
  });

  it('creates demo data with historical completed tasks', () => {
    const demoState = createDemoState(seedState);
    const todayKey = new Date().toISOString().slice(0, 10);

    expect(demoState.tasks.length).toBeGreaterThan(3);
    expect(demoState.rounds.length).toBeGreaterThan(0);
    expect(demoState.taskBank.length).toBeGreaterThan(0);
    expect(demoState.tasks.some((task) => task.status === 'done' && task.completedAt && task.plannedDate < todayKey)).toBe(true);
    expect(demoState.tasks.some((task) => task.plannedDate === todayKey)).toBe(true);
  });
});
