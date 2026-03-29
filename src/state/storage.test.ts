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
});
