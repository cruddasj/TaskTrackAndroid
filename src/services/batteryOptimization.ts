import { Capacitor } from '@capacitor/core';
import { BatteryOptimization } from '@capawesome-team/capacitor-android-battery-optimization';

const isAndroidNative = (): boolean => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const isBatteryOptimizationEnabled = async (): Promise<boolean | null> => {
  if (!isAndroidNative()) return null;

  const { enabled } = await BatteryOptimization.isBatteryOptimizationEnabled();
  return enabled;
};

export const openBatteryOptimizationSettings = async (): Promise<boolean> => {
  if (!isAndroidNative()) return false;

  await BatteryOptimization.openBatteryOptimizationSettings();
  return true;
};
