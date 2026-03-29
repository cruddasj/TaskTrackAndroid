import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

const getGreeting = (hour: number): string => {
  if (hour >= 6 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const completed = state.tasks.filter((task) => task.status === 'done').length;
  const progress = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0;
  const totalFocusMinutes = state.pomodoro.completedWorkSessions * state.settings.pomodoroMinutes;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return getGreeting(hour);
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3">{greeting}, {state.userName}</Typography>
        <Typography color="text.secondary">Pick a round, focus on one task, and track your completion progress.</Typography>
      </Box>

      <Card sx={{ background: 'radial-gradient(circle at 65% 40%, rgba(145,247,142,0.28), rgba(14,14,14,1) 60%)' }}>
        <CardContent>
          <Typography variant="overline" color="primary.main" letterSpacing="0.08em">
            {state.pomodoro.phase === 'work' ? 'Active focus session' : 'Break in progress'}
          </Typography>
          <Typography variant="h4" mt={1} mb={2}>
            {state.pomodoro.phase === 'work' ? 'Work on one high-impact task now' : 'Take your break, then return for the next session'}
          </Typography>
          <Button size="large" variant="contained" startIcon={<PlayArrowRounded />} onClick={() => navigate('/focus')}>
            Open Timer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography color="text.secondary">Daily velocity</Typography>
          <Typography variant="h3" color="primary.main">{progress}%</Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 99 }} />
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary">Tasks done</Typography>
            <Typography variant="h4">{completed} / {state.tasks.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary">Total focus</Typography>
            <Typography variant="h4">{totalFocusMinutes}m</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary">Rounds done</Typography>
            <Typography variant="h4">{String(state.pomodoro.completedWorkSessions).padStart(2, '0')}</Typography>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
};
