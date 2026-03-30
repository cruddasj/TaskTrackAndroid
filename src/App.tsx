import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useAppState } from './state/AppStateContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { FocusScreen } from './screens/FocusScreen';
import { RoundsScreen } from './screens/RoundsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TaskBankScreen } from './screens/TaskBankScreen';
import { TodaysTasksScreen } from './screens/TodaysTasksScreen';
import { hasRoundsWithAssignedTasks } from './state/rounds';
import { theme } from './theme';

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
  if (!state.pomodoro.isRunning && !hasRoundsWithAssignedTasks(state.rounds)) {
    return <Navigate to="/rounds" replace />;
  }
  return <FocusScreen />;
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<SetupGate />}>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardScreen />} />
            <Route path="tasks" element={<Navigate to="/tasks-today" replace />} />
            <Route path="tasks-today" element={<TodaysTasksScreen />} />
            <Route path="task-bank" element={<TaskBankScreen />} />
            <Route path="rounds" element={<RoundsScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
          <Route path="/focus" element={<FocusGate />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
