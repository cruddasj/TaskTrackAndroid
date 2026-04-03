# TaskTrack Android (Web + Capacitor)

TaskTrack is a Pomodoro-driven task planner designed for daily execution. You can run it as a web app during development and package it as an Android app with Capacitor.

## What the app does

- Guides users through onboarding, then provides a focused Pomodoro workflow for planning tasks, grouping them into rounds, and tracking completion progress from the dashboard.
- Supports a reusable **Task Bank** plus **Today's Tasks**, including duplicate prevention, quick-add actions, and recurring-task suggestions based on either interval rules (every X days) or weekday rules (for example, Sundays, with overdue catch-up suggestions if missed in the previous week).
- Includes round management and assignment flows (auto-grouping by category, manual assignment, unassigned-task visibility, reordering, deletion recovery) with mobile-friendly controls and beginner-focused guidance copy.
- Runs full work/break timer cycles with configurable durations, alarm tone/volume/repeat settings, local persistence, and recent activity insights/history used for recurring suggestions.

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
- `res://raw/alarm_gentle`
- `res://raw/alarm_pulse`

If you want custom sounds, add corresponding files under `android/app/src/main/res/raw/`.


## Dependency maintenance

- Dependencies were upgraded to the latest available major versions that are compatible with this toolchain.
- GitHub Actions now run on Node.js 22 to match Capacitor 8 CLI engine requirements.
- Dependabot is configured in `.github/dependabot.yml` to open weekly updates for both npm packages and GitHub Actions.
- All GitHub Actions in workflows are pinned to full commit SHAs for supply-chain safety.

## Android release workflow notes

- Release APK builds now use app id `com.tasktrack.android` to avoid install conflicts with older package signatures.
- Release APK builds are signed with a stable release keystore provided via GitHub Actions secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) so upgrade installs remain compatible.
- The Android release workflow automatically keeps only the latest 3 generated GitHub releases/tags and deletes older auto-generated release tags.
