# AGENTS.md

## Purpose
This repository contains TaskTrack Android (React + Capacitor). Keep changes focused, testable, and easy to understand.

## Change workflow expectations
- Prefer small, scoped commits tied to a user-visible problem or feature.
- Preserve TypeScript strictness and existing lint/style patterns.
- Update or add automated tests for logic changes.
- Always run linting checks (`npm run lint`) as part of every change, and fix any warnings/errors before committing.
- Run relevant checks before committing (`npm run test:coverage` at minimum for behavior changes).

## Product/content guidance
- Use plain, direct UX copy.
- Prefer explicit instructions over ambiguous labels.
- Keep setup and settings language beginner-friendly.
- Use green-styled guidance callouts/alerts consistently across the app (avoid blue guidance styling).

## Alarm and timer behavior
- Any change to Pomodoro alarms should consider both web and native behavior.
- Alarm behavior must remain user-configurable from Settings.

## Documentation rule (required)
Update `README.md` in the same PR only when major functionality changes are introduced. For major changes, reflect:
- What changed for users.
- Any new settings/options.
- Any setup/runtime implications.
- Any new scripts or testing expectations.

## PR quality bar
- Feature request addressed end-to-end (UI + state + persistence where relevant).
- Tests pass and coverage remains at/above configured threshold.
- README stays accurate.

## CI/build safety checks (required)
- Before committing, run the same core checks used by CI for app health:
  - `npm run lint`
  - `npm run test:coverage` (for behavior or logic changes)
  - `npm run build` (required for TypeScript/packaging validation)
- Treat TypeScript compile errors as blocking, even if tests pass.
