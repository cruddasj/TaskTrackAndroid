import { loadState, saveState, seedState } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns seed state when local storage is empty', () => {
    expect(loadState()).toEqual(seedState);
  });

  it('saves and loads state with alarm repeat count', () => {
    const updated = {
      ...seedState,
      settings: {
        ...seedState.settings,
        alarmRepeatCount: 5,
      },
    };

    saveState(updated);

    expect(loadState().settings.alarmRepeatCount).toBe(5);
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
          },
        ],
      }),
    );

    const loaded = loadState();
    expect(loaded.taskBank[0].recurrenceDays).toBeUndefined();
    expect(loaded.taskBank[1].recurrenceDays).toBe(3);
  });
});
