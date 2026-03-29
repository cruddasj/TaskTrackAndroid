# TaskTrack Android (Web + Capacitor)

TaskTrack is a Pomodoro-driven task planner designed for daily execution. You can run it as a web app during development and package it as an Android app with Capacitor.

## What the app does

- Guides users through setup (name + categories) before normal app navigation.
- Lets users maintain a reusable **Task Bank** and a daily **Today's Tasks** list.
- Organizes daily tasks into **Rounds** (focus sessions).
- Runs a full Pomodoro flow with **work**, **short break**, and **long break** phases.
- Sends completion notifications and plays a configurable alarm tone.
- Supports configurable alarm repeat count (how many times the alarm rings at session end).
- Persists all app state to local storage on device.

## Tech stack

- React 19 + TypeScript
- MUI 7
- React Router 7
- Vite 7
- Capacitor 7 (Android)
- Jest + ts-jest for automated tests

## Getting started

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev           # Start local web development server
npm run build         # Type-check and build production assets
npm run preview       # Serve production build locally
npm run lint          # Run ESLint
npm run test:jest     # Run Jest tests
npm run test:coverage # Run Jest with coverage report
npm run cap:sync      # Build and sync web assets to Android project
npm run cap:open      # Open Android project in Android Studio
```

## Testing and coverage target

The repo includes Jest coverage thresholds of 80% for lines, statements, branches, and functions.

## Android notification sound notes

The app schedules native local notifications with sound references in the format:

- `res://raw/alarm_bell`
- `res://raw/alarm_chime`
- `res://raw/alarm_digital`

If you want custom sounds, add corresponding files under `android/app/src/main/res/raw/`.
