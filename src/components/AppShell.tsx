import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { Capacitor } from '@capacitor/core';
import { BottomNavigation, BottomNavigationAction, Box, Button, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { hasRoundsWithAssignedTasks } from '../state/rounds';
import { areAllTasksCompletedForDate } from '../state/tasks';
import { formatTime, getTodayKey } from '../utils';

const tabs = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlined /> },
  { label: 'Task Bank', path: '/task-bank', icon: <ListAltOutlined /> },
  { label: 'Tasks', path: '/tasks', icon: <ListAltOutlined /> },
  { label: 'Rounds', path: '/rounds', icon: <TimerOutlined /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlined /> },
];

export const AppShell = () => {
  const { state, successMessage, clearSuccessMessage } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstTimeUser = !state.userName.trim();
  const hasTrackableRound = hasRoundsWithAssignedTasks(state.rounds, getTodayKey());
  const allTodaysTasksDone = areAllTasksCompletedForDate(state.tasks, getTodayKey());
  const showTimerButton = !allTodaysTasksDone && (state.pomodoro.isRunning || hasTrackableRound);
  const visibleTabs = useMemo(() => isFirstTimeUser ? tabs.filter((tab) => tab.path === '/settings') : tabs, [isFirstTimeUser]);
  const current = useMemo(() => visibleTabs.find((tab) => tab.path === location.pathname)?.path || false, [visibleTabs, location.pathname]);
  const topPadding = Capacitor.isNativePlatform()
    ? 'calc(max(env(safe-area-inset-top, 0px), 24px) + 12px)'
    : '16px';
  const horizontalSafeArea = 'max(env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px))';

  return (
    <Box
      minHeight="100dvh"
      bgcolor="background.default"
      pb="calc(96px + env(safe-area-inset-bottom, 0px))"
      pt={topPadding}
      pl="env(safe-area-inset-left, 0px)"
      pr="env(safe-area-inset-right, 0px)"
    >
      <Box px={{ xs: 2, md: 4 }} py={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="h5" color="primary.main" fontWeight={800}>
            TaskTrack
          </Typography>
          {showTimerButton && (
            <Button
              variant={state.pomodoro.isRunning ? 'contained' : 'outlined'}
              size="small"
              onClick={() => navigate('/focus')}
            >
              {state.pomodoro.isRunning ? 'Active round' : 'Timer'} {formatTime(state.pomodoro.remainingSeconds)}
            </Button>
          )}
        </Stack>
      </Box>
      <Box px={{ xs: 2, md: 4 }}>
        <Outlet />
      </Box>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#121212',
          backgroundImage: 'none',
          pb: 'env(safe-area-inset-bottom, 0px)',
          pl: 'env(safe-area-inset-left, 0px)',
          pr: 'env(safe-area-inset-right, 0px)',
          zIndex: (theme) => theme.zIndex.appBar,
          borderTop: '1px solid rgba(145, 247, 142, 0.14)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={current}
          onChange={(_, next) => navigate(next)}
          showLabels
          sx={{
            bgcolor: '#121212',
            height: 72,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              px: 0.25,
              flex: 1,
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.72rem',
              lineHeight: 1.1,
              whiteSpace: 'normal',
              textAlign: 'center',
            },
            '& .MuiBottomNavigationAction-label.Mui-selected': {
              fontSize: '0.75rem',
            },
          }}
        >
          {visibleTabs.map((tab) => (
            <BottomNavigationAction key={tab.path} value={tab.path} label={tab.label} icon={tab.icon} />
          ))}
        </BottomNavigation>
      </Paper>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={2500}
        onClose={clearSuccessMessage}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          mb: 'calc(70px + env(safe-area-inset-bottom, 0px))',
          ml: `calc(${horizontalSafeArea} / 2)`,
          mr: `calc(${horizontalSafeArea} / 2)`,
        }}
      />
    </Box>
  );
};
