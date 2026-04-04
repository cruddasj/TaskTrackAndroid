import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

export const keepScreenAwake = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  await KeepAwake.keepAwake();
};

export const allowScreenSleep = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  await KeepAwake.allowSleep();
};
