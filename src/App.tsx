import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DashboardScreen } from './screens/DashboardScreen';
import { FocusScreen } from './screens/FocusScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { RoundsScreen } from './screens/RoundsScreen';
import { TasksScreen } from './screens/TasksScreen';
import { theme } from './theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardScreen />} />
          <Route path="tasks" element={<TasksScreen />} />
          <Route path="rounds" element={<RoundsScreen />} />
          <Route path="insights" element={<InsightsScreen />} />
        </Route>
        <Route path="/focus" element={<FocusScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
