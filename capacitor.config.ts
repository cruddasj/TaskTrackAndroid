import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tasktrack.app',
  appName: 'TaskTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
