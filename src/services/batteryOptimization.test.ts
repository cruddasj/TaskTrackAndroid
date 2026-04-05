import { Capacitor } from '@capacitor/core';
import { BatteryOptimization } from '@capawesome-team/capacitor-android-battery-optimization';
import { isBatteryOptimizationEnabled, openBatteryOptimizationSettings } from './batteryOptimization';

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
    getPlatform: jest.fn(),
  },
}));

jest.mock('@capawesome-team/capacitor-android-battery-optimization', () => ({
  BatteryOptimization: {
    isBatteryOptimizationEnabled: jest.fn(),
    openBatteryOptimizationSettings: jest.fn(),
  },
}));

const isNativePlatformMock = Capacitor.isNativePlatform as jest.Mock;
const getPlatformMock = Capacitor.getPlatform as jest.Mock;
const isBatteryOptimizationEnabledMock = BatteryOptimization.isBatteryOptimizationEnabled as jest.Mock;
const openBatteryOptimizationSettingsMock = BatteryOptimization.openBatteryOptimizationSettings as jest.Mock;

describe('battery optimization service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null on non-native platforms', async () => {
    isNativePlatformMock.mockReturnValue(false);

    await expect(isBatteryOptimizationEnabled()).resolves.toBeNull();
    expect(isBatteryOptimizationEnabledMock).not.toHaveBeenCalled();
  });

  it('returns null on native non-android platforms', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('ios');

    await expect(isBatteryOptimizationEnabled()).resolves.toBeNull();
    expect(isBatteryOptimizationEnabledMock).not.toHaveBeenCalled();
  });

  it('returns optimization status on native android', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');
    isBatteryOptimizationEnabledMock.mockResolvedValue({ enabled: true });

    await expect(isBatteryOptimizationEnabled()).resolves.toBe(true);
  });

  it('opens settings on native android', async () => {
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('android');
    openBatteryOptimizationSettingsMock.mockResolvedValue(undefined);

    await expect(openBatteryOptimizationSettings()).resolves.toBe(true);
    expect(openBatteryOptimizationSettingsMock).toHaveBeenCalledTimes(1);
  });

  it('returns false when opening settings off android', async () => {
    isNativePlatformMock.mockReturnValue(false);

    await expect(openBatteryOptimizationSettings()).resolves.toBe(false);
    expect(openBatteryOptimizationSettingsMock).not.toHaveBeenCalled();
  });
});
