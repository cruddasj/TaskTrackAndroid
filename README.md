# TaskTrack Android (Web + Capacitor)

TaskTrack is a Pomodoro-driven task planner designed for daily execution. You can run it as a web app during development and package it as an Android app with Capacitor.

## What the app does

- Guides users through setup (name + categories) before normal app navigation.
- Lets users maintain a reusable **Task Bank** and a daily **Today's Tasks** list.
- Organizes daily tasks into **Rounds** (focus sessions).
- Lets users auto-suggest round groupings by task category and splits suggested groups so they stay within the configured Pomodoro duration.
- Lets users reorder rounds directly from the Rounds page using up/down controls.
- Shows a session-aware dashboard card that lists planned round tasks and guides users to assign or add tasks when a round is empty.
- Uses **upcoming round** language on the dashboard and prevents assignment prompts while a break is active.
- Uses a today-focused completion metric on the dashboard (`Today's planned tasks completed`) instead of `Daily velocity`, with supporting stat labels that explicitly refer to the current day.
- Shows a 7-day dashboard summary of completed focus minutes grouped by category.
- Shows a 7-day activity history with planned/completed counts by day.
- Uses dashboard guidance language that emphasizes focused attention periods across small, manageable tasks.
- Uses consistent **Active Session** terminology across the dashboard and focus timer screens.
- Provides a quick-add floating action button in both **Task Bank** and **Today's Tasks** screens.
- Uses mobile-optimized layouts for dashboard stat cards, larger floating add buttons, an opaque safe-area-aware app shell, and a scrollable Focus session task list on smaller screens.
- Adds extra inset around the Focus timer clock text on smaller screens so the time stays comfortably inside the circular timer boundary.
- Runs a full Pomodoro flow with **work**, **short break**, and **long break** phases.
- Sends completion notifications and plays a configurable alarm tone.
- Supports configurable alarm repeat count (how many times the alarm rings at session end).
- Persists all app state to local storage on device.
- Stores task planning/completion timestamps so recent (last 7 days) activity can be reviewed from the dashboard.

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

## Android release workflow notes

- Release APK builds now use app id `com.tasktrack.android` to avoid install conflicts with older package signatures.
- The Android release workflow automatically keeps only the latest 3 generated GitHub releases/tags and deletes older auto-generated release tags.
