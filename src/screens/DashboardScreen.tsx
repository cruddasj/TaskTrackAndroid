import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { Box, Button, Card, CardContent, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { getGreeting } from './greeting';

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const todayKey = new Date().toISOString().slice(0, 10);
  const recentDayKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return date.toISOString().slice(0, 10);
  });
  const todaysTasks = state.tasks.filter((task) => task.plannedDate === todayKey);
  const completed = todaysTasks.filter((task) => task.status === 'done').length;
  const progress = todaysTasks.length ? Math.round((completed / todaysTasks.length) * 100) : 0;
  const totalFocusMinutes = state.pomodoro.completedWorkSessions * state.settings.pomodoroMinutes;
  const currentRound = state.rounds.find((round) => round.id === state.pomodoro.activeRoundId)
    ?? state.rounds.find((round) => round.status === 'active');
  const currentRoundTasks = currentRound
    ? currentRound.taskIds
      .map((taskId) => todaysTasks.find((task) => task.id === taskId))
      .filter((task): task is NonNullable<typeof task> => !!task)
    : [];
  const nextRound = currentRound
    ? state.rounds
      .slice(state.rounds.findIndex((round) => round.id === currentRound.id) + 1)
      .find((round) => round.status !== 'done')
    : state.rounds.find((round) => round.status === 'upcoming');
  const nextRoundTasks = nextRound
    ? nextRound.taskIds
      .map((taskId) => todaysTasks.find((task) => task.id === taskId))
      .filter((task): task is NonNullable<typeof task> => !!task)
    : [];
  const hasTodayTasks = todaysTasks.length > 0;
  const categoryTotals = recentDayKeys.reduce<Record<string, number>>((acc, dayKey) => {
    state.tasks
      .filter((task) => task.completedAt?.startsWith(dayKey))
      .forEach((task) => {
        acc[task.category] = (acc[task.category] ?? 0) + task.estimateMinutes;
      });
    return acc;
  }, {});
  const historyByDay = recentDayKeys.map((dayKey) => {
    const planned = state.tasks.filter((task) => task.plannedDate === dayKey);
    const completedForDay = state.tasks.filter((task) => task.completedAt?.startsWith(dayKey));
    return { dayKey, planned, completedForDay };
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return getGreeting(hour);
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3">{greeting}, {state.userName}</Typography>
        <Typography color="text.secondary">Pick a round and use focused attention blocks to move through small, manageable tasks.</Typography>
      </Box>

      <Card sx={{ background: 'radial-gradient(circle at 65% 40%, rgba(145,247,142,0.28), rgba(14,14,14,1) 60%)' }}>
        <CardContent>
          <Typography variant="overline" color="primary.main" letterSpacing="0.08em">
            {state.pomodoro.phase === 'work' ? 'Active focus session' : 'Break in progress'}
          </Typography>
          <Typography variant="h4" mt={1} mb={2}>
            {state.pomodoro.phase === 'work'
              ? (currentRoundTasks.length > 0 ? 'Your current round tasks' : 'Ready to plan your current round?')
              : 'Break in progress'}
          </Typography>
          {currentRoundTasks.length > 0 ? (
            <>
              <Typography color="text.secondary" mb={2}>These tasks are queued for your current round.</Typography>
              <Stack spacing={1.25} mb={2.5}>
                {currentRoundTasks.map((task) => (
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
                {state.pomodoro.phase !== 'work'
                  ? 'You are currently on a break. Round planning resumes after your break ends.'
                  : hasTodayTasks
                  ? 'Assign tasks to this round before starting your next active session.'
                  : 'Add tasks to Today\'s Tasks first, then assign them into a round.'}
              </Typography>
              {state.pomodoro.phase === 'work' && (
                <Button
                  size="large"
                  variant="contained"
                  startIcon={<PlayArrowRounded />}
                  onClick={() => navigate(hasTodayTasks ? '/rounds' : '/tasks-today')}
                >
                  {hasTodayTasks ? 'Assign tasks' : 'Add today\'s tasks'}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card sx={{ background: 'radial-gradient(circle at 65% 40%, rgba(96,174,255,0.30), rgba(14,14,14,1) 60%)' }}>
        <CardContent>
          <Typography variant="overline" color="#60aeff" letterSpacing="0.08em">
            Next round
          </Typography>
          <Typography variant="h5" mt={1} mb={2}>
            {nextRoundTasks.length > 0 ? 'Planned next round tasks' : 'No tasks planned for the next round yet'}
          </Typography>
          {nextRoundTasks.length > 0 ? (
            <Stack spacing={1.25}>
              {nextRoundTasks.map((task) => (
                <Stack key={task.id} direction="row" spacing={1} alignItems="center">
                  <CheckCircleRounded sx={{ color: '#60aeff' }} fontSize="small" />
                  <Typography>{task.title}</Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">
              {hasTodayTasks
                ? 'Assign tasks to a later round so they are ready when this round ends.'
                : 'Add tasks to Today\'s Tasks first, then assign them into your next round.'}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography color="text.secondary">Today&apos;s planned tasks completed</Typography>
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
              Completed today
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{completed} / {todaysTasks.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: { xs: 'calc(50% - 8px)', sm: 0 } }}>
          <CardContent>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: '0.82rem', sm: '0.92rem' }, lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              Focus minutes today
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
              Sessions completed today
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{String(state.pomodoro.completedWorkSessions).padStart(2, '0')}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={1}>Completed focus by category (last 7 days)</Typography>
          <Stack spacing={0.75}>
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([category, minutes]) => (
                <Stack key={category} direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">{category}</Typography>
                  <Typography>{minutes} min</Typography>
                </Stack>
              ))}
            {Object.keys(categoryTotals).length === 0 && (
              <Typography color="text.secondary">No completed tasks in the last 7 days yet.</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={1}>Last 7 days activity</Typography>
          <Stack spacing={1.25}>
            {historyByDay.map(({ dayKey, planned, completedForDay }, index) => (
              <Box key={dayKey}>
                <Typography fontWeight={700}>{dayKey}</Typography>
                <Typography color="text.secondary" variant="body2">
                  Planned: {planned.length}
                </Typography>
                <Typography color="text.secondary" variant="body2" mb={1}>
                  Completed: {completedForDay.length}
                </Typography>
                <Stack spacing={0.75}>
                  {Object.entries(
                    completedForDay.reduce<Record<string, string[]>>((acc, task) => {
                      acc[task.category] = [...(acc[task.category] ?? []), task.title];
                      return acc;
                    }, {}),
                  ).map(([category, titles]) => (
                    <Box key={`${dayKey}-${category}`}>
                      <Typography variant="body2">
                        {category}: {titles.length} completed
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {titles.join(', ')}
                      </Typography>
                    </Box>
                  ))}
                  {completedForDay.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No completed tasks recorded.</Typography>
                  )}
                </Stack>
                {index < historyByDay.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};
