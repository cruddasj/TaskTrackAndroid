# TaskTrack (Web SPA + Capacitor Android)

TaskTrack is a Material-based Pomodoro task tracker that runs as a single-page web app and can be packaged as an Android app via Capacitor.

## Features

- SPA navigation: Dashboard, Tasks, Rounds, Insights, and Focus Mode
- Local storage persistence for tasks, rounds, and current pomodoro state
- Focus timer with circular progress
- Completion notifications:
  - Browser Notification API on web
  - Capacitor Local Notifications on Android
- Alarm bell audio cue generated in-app (Web Audio API)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Android (Capacitor)

```bash
npm run cap:sync
npm run cap:open
```

### Android alarm sound file (optional native enhancement)

For a custom native notification sound, add `alarm_bell.mp3` as `android/app/src/main/res/raw/alarm_bell.mp3`.
The app already references `res://raw/alarm_bell` in local notification scheduling.
