import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { BottomNavigation, BottomNavigationAction, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

const tabs = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlined /> },
  { label: "Today's Tasks", path: '/tasks-today', icon: <ListAltOutlined /> },
  { label: 'Task Bank', path: '/task-bank', icon: <ListAltOutlined /> },
  { label: 'Rounds', path: '/rounds', icon: <TimerOutlined /> },
  { label: 'Insights', path: '/insights', icon: <InsightsOutlined /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlined /> },
];

export const AppShell = () => {
  const { state } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstTimeUser = !state.userName.trim();
  const visibleTabs = isFirstTimeUser ? tabs.filter((tab) => tab.path === '/settings') : tabs;
  const current = visibleTabs.find((tab) => tab.path === location.pathname)?.path ?? false;
  const minutes = Math.floor(state.pomodoro.remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (state.pomodoro.remainingSeconds % 60).toString().padStart(2, '0');

  return (
    <Box minHeight="100dvh" bgcolor="background.default" pb={10}>
      <Box px={{ xs: 2, md: 4 }} py={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="h5" color="primary.main" fontWeight={800}>
            TaskTrack
          </Typography>
          <Button
            variant={state.pomodoro.isRunning ? 'contained' : 'outlined'}
            size="small"
            onClick={() => navigate('/focus')}
          >
            {state.pomodoro.isRunning ? 'Pomodoro' : 'Timer'} {minutes}:{seconds}
          </Button>
        </Stack>
      </Box>
      <Box px={{ xs: 2, md: 4 }}>
        <Outlet />
      </Box>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: '#121212' }} elevation={0}>
        <BottomNavigation
          value={current}
          onChange={(_, next) => navigate(next)}
          showLabels
          sx={{ bgcolor: 'transparent', height: 72 }}
        >
          {visibleTabs.map((tab) => (
            <BottomNavigationAction key={tab.path} value={tab.path} label={tab.label} icon={tab.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};
