import type { CapacitorConfig } from '@capacitor/cli';

/// <reference types="@capacitor/push-notifications" />

const config: CapacitorConfig = {
  appId: 'com.tasktrack.android',
  appName: 'TaskTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
