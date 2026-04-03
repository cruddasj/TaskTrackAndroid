import { CssBaseline, ThemeProvider } from '@mui/material';
import { useCallback, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useAppState } from './state/AppStateContext';
import { RuntimeErrorBoundary } from './debug/RuntimeErrorBoundary';
import { RuntimeErrorDialog } from './debug/RuntimeErrorDialog';
import { type CapturedRuntimeError, useRuntimeErrorMonitor } from './debug/runtimeErrorMonitor';
import { DashboardScreen } from './screens/DashboardScreen';
import { FocusScreen } from './screens/FocusScreen';
import { RoundsScreen } from './screens/RoundsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TaskBankScreen } from './screens/TaskBankScreen';
import { TodaysTasksScreen } from './screens/TodaysTasksScreen';
import { hasRoundsWithAssignedTasks } from './state/rounds';
import { theme } from './theme';
import { getTodayKey } from './utils';

const SetupGate = () => {
  const { state } = useAppState();
  const location = useLocation();

  if (!state.userName.trim() && location.pathname !== '/settings') {
    return <Navigate to="/settings" replace />;
  }

  return <Outlet />;
};

const FocusGate = () => {
  const { state } = useAppState();
  if (!state.pomodoro.isRunning && !hasRoundsWithAssignedTasks(state.rounds, getTodayKey())) {
    return <Navigate to="/rounds" replace />;
  }
  return <FocusScreen />;
};

export default function App() {
  const [capturedError, setCapturedError] = useState<CapturedRuntimeError | null>(null);

  const handleRuntimeError = useCallback((error: CapturedRuntimeError) => {
    setCapturedError(error);
  }, []);

  useRuntimeErrorMonitor(handleRuntimeError);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RuntimeErrorBoundary onError={handleRuntimeError}>
      <Routes>
        <Route element={<SetupGate />}>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardScreen />} />
            <Route path="tasks" element={<TodaysTasksScreen />} />
            <Route path="tasks-today" element={<Navigate to="/tasks" replace />} />
            <Route path="task-bank" element={<TaskBankScreen />} />
            <Route path="rounds" element={<RoundsScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
          <Route path="/focus" element={<FocusGate />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </RuntimeErrorBoundary>
      <RuntimeErrorDialog error={capturedError} onClose={() => setCapturedError(null)} />
    </ThemeProvider>
  );
}
