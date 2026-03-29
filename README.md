# TaskTrack (SPA + Android via Capacitor)

TaskTrack is a single-page application built with React + Material UI using the "Obsidian Architect" design language from `DESIGN.md`.

## Features

- SPA with Dashboard, Task Bank, Rounds, and Insights surfaces.
- Pomodoro timer with deep-focus UI.
- Local persistence of tasks, rounds, tab state, and timer state via `localStorage`.
- Completion notifications:
  - Web: browser Notification API.
  - Android (Capacitor): `@capacitor/local-notifications` scheduling with custom sound hook (`bell.wav`).
- Capacitor config included for Android packaging.

## Run as web app

```bash
npm install
npm run dev
```

## Build + sync to Android

```bash
npm run cap:sync
npm run cap:open
```

> To use a custom Android notification bell, add `bell.wav` under `android/app/src/main/res/raw/bell.wav` after creating the Android project.
