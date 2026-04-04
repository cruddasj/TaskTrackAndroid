import { getActiveNotificationRemainingSeconds } from './activeNotification';

describe('getActiveNotificationRemainingSeconds', () => {
  it('keeps second-level precision while app is active', () => {
    expect(getActiveNotificationRemainingSeconds(119, true)).toBe(119);
  });

  it('rounds up to the next minute while app is in background', () => {
    expect(getActiveNotificationRemainingSeconds(119, false)).toBe(120);
    expect(getActiveNotificationRemainingSeconds(61, false)).toBe(120);
  });
});
