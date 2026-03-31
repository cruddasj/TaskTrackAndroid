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

## Timer + rounds behavior map (keep in sync)
Use this section as the source of truth whenever changing `/rounds` or `/focus` behavior.

### Current workflow contract
- **Rounds page is the planning source**: tasks planned for today can be unassigned or assigned to a round.
- **Timer (Focus) page tracks one visible round** based on active round id first, then requested round id, then round status.
- **Work-session completion advances rounds**:
  - If another open round exists, current round is marked done and the next open round becomes active.
  - If no open round exists, the app now checks for today tasks that are still unfinished and unassigned.
  - When such tasks exist, the app auto-creates a new recovery round and assigns those tasks so the timer can continue without looping on a completed round.
- **Break transitions do not reorder rounds**; they only change timer phase.

### Required update rule for future changes
When you modify timer/round linkage behavior, update this AGENTS section in the same PR with:
1. Trigger conditions (exactly when round progression runs).
2. Round status transitions (`active`, `upcoming`, `done`).
3. Task assignment side effects (including carry-forward and unassigned-task handling).
4. Any route-guard or visibility fallback changes (`/focus` and `/rounds`).
5. Tests added/updated that prove the workflow.

If a change touches timer progression and this section is not updated, treat that PR as incomplete.
