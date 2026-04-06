# TaskTrack Android (Web + PWA + Capacitor)

TaskTrack is a Pomodoro-driven task planner designed for daily execution. It runs as a web app with Progressive Web App (PWA) support and can also be packaged as an Android app with Capacitor. The product experience is primarily optimized for desktop usage, while Android packaging focuses on reliable timer notifications and battery-optimization testing.

## What the app does

- Guides users through onboarding, then provides a focused Pomodoro workflow for planning tasks, grouping them into rounds, and tracking completion progress from the dashboard.
- Supports a reusable **Task Bank** plus **Today's Tasks**, including duplicate prevention, quick-add actions, and recurring-task suggestions based on either interval rules (every X days) or weekday rules (for example, Sundays, with overdue catch-up suggestions if missed in the previous week).
- Includes round management and assignment flows (auto-grouping by category, manual assignment, unassigned-task visibility, reordering, deletion recovery) with mobile-friendly controls and beginner-focused guidance copy.
- Runs full work/break timer cycles with configurable durations, alarm tone/volume/repeat settings, local persistence, and recent activity insights/history used for recurring suggestions.
- Uses native local-notification scheduling for Pomodoro phase completion on Android so sessions remain reliable when the app is backgrounded or closed, including pause/resume by cancelling and rescheduling the same session notification id.
- Includes Android-specific battery optimization checks/settings access so users can validate notification reliability on devices that aggressively restrict background work.

## Platform support

- **Web + PWA:** installable progressive web app for desktop workflows (primary target experience).
- **Android (Capacitor):** native wrapper plus Android-specific integrations for local notifications and battery optimization handling.

## Tech stack

- React 19 + TypeScript
- MUI 7
- React Router 7
- Vite 8
- vite-plugin-pwa
- Capacitor 8 (Android)
- Jest + ts-jest for automated tests
- `@capawesome-team/capacitor-android-battery-optimization` for Android battery optimization checks/settings handoff

## Developer quick start

```bash
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`) for local development.

## Build, run, and test

### Build

```bash
npm run build
```

### Run (web)

```bash
npm run dev
npm run preview
```

### Test and quality checks

```bash
npm run lint
npm run test:jest
npm run test:coverage
```

### Android packaging flow

```bash
npm run cap:sync
npm run cap:open
```

`npm run cap:sync` builds web assets, syncs Capacitor Android files, and copies custom alarm sounds into Android raw resources.

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

- `res://raw/alarm_clock_bell`
- `res://raw/alarm_fallout`
- `res://raw/alarm_chirp`
- `res://raw/alarm_digital`

Custom tone source files live in `public/custom_alarm_sounds/` and `npm run cap:sync` now copies supported files (`.mp3`, `.wav`, `.ogg`) into `android/app/src/main/res/raw/` automatically.

For the ongoing timer/phase-complete notification status-bar glyph, `npm run cap:sync` also writes `android/app/src/main/res/drawable/ic_stat_timer.xml` (the Android `smallIcon` resource used by local notifications). This icon must live in a drawable resource directory (not `res/raw`).

If you need to copy without a full sync, run `npm run cap:copy-alarm-sounds`.

## Android Pomodoro background reliability notes

- Pomodoro phase timers are scheduled through Capacitor Local Notifications (`allowWhileIdle: true`) instead of relying on a continuous JavaScript interval in the background.
- Pausing a running Pomodoro cancels its scheduled native notification and stores remaining duration.
- Resuming starts a new native schedule using the stored remaining duration and the same session id to avoid duplicates.
- When you generate/update the Android project, include exact-alarm support in `android/app/src/main/AndroidManifest.xml`:
  - `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />`


## Dependency maintenance

- Dependencies were upgraded to the latest available major versions that are compatible with this toolchain.
- GitHub Actions now run on Node.js 22 to match Capacitor 8 CLI engine requirements.
- Dependabot is configured in `.github/dependabot.yml` to open weekly updates for both npm packages and GitHub Actions.
- All GitHub Actions in workflows are pinned to full commit SHAs for supply-chain safety.

## Android release workflow notes

- Release APK builds now use app id `com.tasktrack.android` to avoid install conflicts with older package signatures.
- Release APK builds are signed with a stable release keystore provided via GitHub Actions secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) so upgrade installs remain compatible.
- The Android release workflow automatically keeps only the latest 3 generated GitHub releases/tags and deletes older auto-generated release tags.
