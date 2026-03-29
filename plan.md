1. **Analyze Requirements and Resources:**
   - I have 10 screens from Stitch UI design for a "Edit Chore" / TaskTrack application.
   - The app needs to be a Single Page Application (SPA).
   - Data (tasks) needs to be stored in `localStorage`.
   - Notifications and an alarm bell sound should trigger when a pomodoro session completes.
   - The app must be packaged as an Android application using CapacitorJS, while remaining functional as a web app.
   - Design System details (Theme: Hearth & Habit or similar based on images) should be implemented. Let's refer to the downloaded images and HTML.

2. **Project Setup:**
   - Initialize a new frontend project (e.g., using Vite with React or Vue, or plain vanilla JS if simpler, but React/Vue is better for SPA state management). Let's use Vite + React with TypeScript for robust development.
   - Install dependencies: `react`, `react-dom`, `react-router-dom` (for routing between screens), `tailwindcss` (for styling, mirroring the utility-class approach often found in generated HTML), `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/local-notifications`.

3. **Design System & Styling:**
   - Extract the core colors, typography (Plus Jakarta Sans, Be Vietnam Pro), and spacing from the Stitch design system data.
   - Set up Tailwind CSS configuration to match the design system tokens (colors, font families, rounded corners).
   - Create reusable UI components (Buttons, Cards, Inputs, Progress Bars) based on the downloaded HTML/images.

4. **Routing & Screen Implementation:**
   - Set up React Router for the main views:
     - Dashboard / Task Bank
     - Rounds View
     - Active Timer View
   - Implement responsive layouts (handling both Desktop and Mobile designs provided in the screens).

5. **State Management & Local Storage:**
   - Create a context or custom hook to manage the state of tasks (CRUD operations).
   - Persist this state to `localStorage` on every change and initialize from it on load.

6. **Pomodoro Timer & Notifications:**
   - Implement the timer logic in the Active Timer screen.
   - Integrate Web Notifications API (for web) and Capacitor Local Notifications plugin (for Android).
   - Add an audio element to play the alarm bell sound upon timer completion.

7. **Capacitor Android Setup:**
   - Initialize Capacitor (`npx cap init`).
   - Add Android platform (`npx cap add android`).
   - Configure capacitor to use the Vite build output directory.
   - Build the web app and sync with Capacitor (`npm run build && npx cap sync`).

8. **Pre-commit Checks:**
   - Run linter, type checks, and ensure the build process succeeds for both web and android.

9. **Review & Refine:**
   - Ensure dark mode support is implemented as per the provided dark screens.

Completed all steps. Verified that it builds properly. Now, pre-commit checks.
