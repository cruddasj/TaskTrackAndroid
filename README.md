# TaskTrack Android (Web + Capacitor)

TaskTrack is a Pomodoro-driven task planner designed for daily execution. You can run it as a web app during development and package it as an Android app with Capacitor.

## What the app does

- Guides users through setup (name + categories) before normal app navigation.
- Lets users maintain a reusable **Task Bank** and a daily **Today's Tasks** list.
- Lets users set an optional repeat interval in days for each **Task Bank** item (for example, every 7 days).
- Lets users open a recurring-task suggestion prompt on **Today's Tasks** and review due suggestions before adding them.
- Uses explicit **Suggest overdue recurring tasks** copy on **Today's Tasks** so the action matches the due-only suggestion logic.
- Organizes daily tasks into **Rounds** (focus sessions).
- Lets users auto-suggest round groupings by task category and splits suggested groups so they stay within the configured Pomodoro duration.
- Lets users reorder rounds directly from the Rounds page using up/down controls.
- Shows **Edit tasks** on rounds that already have assigned tasks (and **Assign tasks** for empty rounds) to make the next action clearer.
- Shows a session-aware dashboard card that lists planned round tasks and guides users to assign or add tasks when a round is empty.
- Splits dashboard round planning into separate gradient cards for **current round** tasks (green Active Session styling) and **next round** tasks (blue styling) so users can quickly distinguish now vs next.
- Uses **upcoming round** language on the dashboard and prevents assignment prompts while a break is active.
- Uses a today-focused completion metric on the dashboard (`Today's planned tasks completed`) instead of `Daily velocity`, with supporting stat labels that explicitly refer to the current day.
- Shows a 30-day dashboard summary of completed focus minutes grouped by category.
- Shows a 30-day activity history with planned/completed counts by day.
- Shows a richer 30-day activity history layout with planned/completed counts on separate lines, plus completed task categories with per-category task counts and task names.
- Shows a dedicated **Unassigned today tasks** section on the Rounds page so tasks missing a round are always visible.
- Adds a quick **Assign to round** picker for each item in **Unassigned today tasks** so users can place tasks into existing rounds without opening the round editor.
- Shows a confirmation popup when a new round is created.
- Lets users delete rounds directly from the Rounds page; tasks from deleted rounds are returned to **Unassigned today tasks**.
- Shows **Good evening** on the dashboard only from 7:00 PM onward (earlier daytime hours use morning/afternoon greetings).
- Adds a floating **plus** button on the Rounds page so users can create a new round quickly.
- Validates round creation by warning users when an existing round is still empty (no tasks assigned), so they can reuse it instead of creating duplicates.
- Adds first-time-friendly guidance in **Settings** explaining the Pomodoro technique and how timer/alarm values affect new rounds.
- Adds a **Show first-time guidance across the app** toggle in **Settings** so onboarding guidance callouts can be turned on or off anytime.
- Uses consistent green styling for guidance callouts (for example, setup and Pomodoro guidance) to match the app theme.
- Replaces the **Task templates** summary card on **Task Bank** with direct, beginner-friendly **Task Bank guidance** copy.
- Prevents duplicate entries in **Today's Tasks** by warning when the same task name is added again (including quick-adds from Task Bank).
- Uses dashboard guidance language that emphasizes focused attention periods across small, manageable tasks.
- Uses consistent **Active Session** terminology across the dashboard and focus timer screens.
- Provides a quick-add floating action button in both **Task Bank** and **Today's Tasks** screens.
- Uses mobile-optimized layouts for dashboard stat cards, larger floating add buttons, an opaque safe-area-aware app shell, and a scrollable Focus session task list on smaller screens (including Android).
- Adds extra inset around the Focus timer clock text on smaller screens so the time stays comfortably inside the circular timer boundary.
- Runs a full Pomodoro flow with **work**, **short break**, and **long break** phases.
- Sends completion notifications and plays a configurable alarm tone.
- Supports configurable alarm repeat count (how many times the alarm rings at session end).
- Persists all app state to local storage on device.
- Stores task planning/completion timestamps so recent (last 30 days) activity can be reviewed from the dashboard and for recurring task suggestions.

## Tech stack

- React 19 + TypeScript
- MUI 7
- React Router 7
- Vite 8
- Capacitor 8 (Android)
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


## Dependency maintenance

- Dependencies were upgraded to the latest available major versions that are compatible with this toolchain.
- GitHub Actions now run on Node.js 22 to match Capacitor 8 CLI engine requirements.
- Dependabot is configured in `.github/dependabot.yml` to open weekly updates for both npm packages and GitHub Actions.
- All GitHub Actions in workflows are pinned to full commit SHAs for supply-chain safety.

## Android release workflow notes

- Release APK builds now use app id `com.tasktrack.android` to avoid install conflicts with older package signatures.
- The Android release workflow automatically keeps only the latest 3 generated GitHub releases/tags and deletes older auto-generated release tags.
