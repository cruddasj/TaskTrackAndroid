import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { Alert, BottomNavigation, BottomNavigationAction, Box, Button, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

const tabs = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlined /> },
  { label: 'Task Bank', path: '/task-bank', icon: <ListAltOutlined /> },
  { label: "Today's Tasks", path: '/tasks-today', icon: <ListAltOutlined /> },
  { label: 'Rounds', path: '/rounds', icon: <TimerOutlined /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlined /> },
];

export const AppShell = () => {
  const { state, alarmActive, dismissAlarm, successMessage, clearSuccessMessage } = useAppState();
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
    <Box
      minHeight="100dvh"
      bgcolor="background.default"
      pb="calc(80px + env(safe-area-inset-bottom, 0px))"
      pt="calc(env(safe-area-inset-top, 0px) + 12px)"
    >
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
            {state.pomodoro.isRunning ? 'Active session' : 'Timer'} {minutes}:{seconds}
          </Button>
        </Stack>
      </Box>
      {alarmActive && (
        <Box px={{ xs: 2, md: 4 }} pb={2}>
          <Alert severity="warning" action={<Button onClick={dismissAlarm}>Dismiss</Button>}>
            Pomodoro alarm is active.
          </Alert>
        </Box>
      )}
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
        sx={{ mb: 'calc(70px + env(safe-area-inset-bottom, 0px))' }}
      />
    </Box>
  );
};
