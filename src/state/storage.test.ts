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
});
