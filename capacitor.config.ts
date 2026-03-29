import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tasktrack.android',
  appName: 'TaskTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
