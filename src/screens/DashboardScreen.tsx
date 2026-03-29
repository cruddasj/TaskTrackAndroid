import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
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
  const activeRound = state.rounds.find((round) => round.id === state.pomodoro.activeRoundId)
    ?? state.rounds.find((round) => round.status === 'active');
  const plannedSessionTasks = activeRound
    ? activeRound.taskIds
      .map((taskId) => state.tasks.find((task) => task.id === taskId))
      .filter((task): task is NonNullable<typeof task> => !!task)
    : [];
  const hasTodayTasks = state.tasks.length > 0;

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
            {state.pomodoro.phase === 'work'
              ? (plannedSessionTasks.length > 0 ? 'Your next planned tasks' : 'Ready to plan your next focus round?')
              : 'Take your break, then return for the next session'}
          </Typography>
          {plannedSessionTasks.length > 0 ? (
            <>
              <Typography color="text.secondary" mb={2}>These tasks are queued for your current session.</Typography>
              <Stack spacing={1.25} mb={2.5}>
                {plannedSessionTasks.map((task) => (
                  <Stack key={task.id} direction="row" spacing={1} alignItems="center">
                    <CheckCircleRounded color="primary" fontSize="small" />
                    <Typography>{task.title}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button size="large" variant="contained" startIcon={<PlayArrowRounded />} onClick={() => navigate('/focus')}>
                Open Timer
              </Button>
            </>
          ) : (
            <>
              <Typography color="text.secondary" mb={2}>
                {hasTodayTasks
                  ? 'Assign tasks to this round before starting your next active session.'
                  : 'Add tasks to Today\'s Tasks first, then assign them into a round.'}
              </Typography>
              <Button
                size="large"
                variant="contained"
                startIcon={<PlayArrowRounded />}
                onClick={() => navigate(hasTodayTasks ? '/rounds' : '/tasks-today')}
              >
                {hasTodayTasks ? 'Assign tasks' : 'Add today\'s tasks'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography color="text.secondary">Daily velocity</Typography>
          <Typography variant="h3" color="primary.main">{progress}%</Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 99 }} />
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Card sx={{ flex: 1, minWidth: { xs: 'calc(50% - 8px)', sm: 0 } }}>
          <CardContent>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: '0.82rem', sm: '0.92rem' }, lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              Tasks done
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{completed} / {state.tasks.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: { xs: 'calc(50% - 8px)', sm: 0 } }}>
          <CardContent>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: '0.82rem', sm: '0.92rem' }, lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              Total focus
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{totalFocusMinutes}m</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: { xs: 'calc(50% - 8px)', sm: 0 } }}>
          <CardContent>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: '0.82rem', sm: '0.92rem' }, lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              Rounds done
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{String(state.pomodoro.completedWorkSessions).padStart(2, '0')}</Typography>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
};
