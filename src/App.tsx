import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useAppState } from './state/AppStateContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { FocusScreen } from './screens/FocusScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { RoundsScreen } from './screens/RoundsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TasksScreen } from './screens/TasksScreen';
import { theme } from './theme';

const SetupGate = () => {
  const { state } = useAppState();
  const location = useLocation();

  if (!state.userName.trim() && location.pathname !== '/settings') {
    return <Navigate to="/settings" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<SetupGate />}>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardScreen />} />
            <Route path="tasks" element={<TasksScreen />} />
            <Route path="rounds" element={<RoundsScreen />} />
            <Route path="insights" element={<InsightsScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
          <Route path="/focus" element={<FocusScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
