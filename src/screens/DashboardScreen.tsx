import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CircleOutlined from '@mui/icons-material/CircleOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Box, Button, ButtonBase, Card, CardContent, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { formatFocusTimeSpent, getGreeting } from './greeting';
import { getTodayKey, getTomorrowKey } from '../utils';
import { getDashboardHeroCopy, getTodayRoundMetrics, shouldShowCurrentRoundTasks } from './dashboardMetrics';
import { formatHistoryDayLabel, getCategoryTotals, getCompletedTaskHistory } from './dashboardInsights';

const HISTORY_WINDOW_DAYS = 30;

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const todayKey = getTodayKey();
  const tomorrowKey = getTomorrowKey();
  const todaysTasks = state.tasks.filter((task) => task.plannedDate === todayKey);
  const tomorrowTasks = state.tasks.filter((task) => task.plannedDate === tomorrowKey);
  const completed = todaysTasks.reduce((acc, task) => acc + (task.status === 'done' ? 1 : 0), 0);
  const progress = todaysTasks.length > 0 ? Math.round((completed / todaysTasks.length) * 100) : 0;
  const { completedRounds: sessionsCompletedToday, focusedMinutes: totalFocusMinutes } = getTodayRoundMetrics(state.rounds, todaysTasks);
  const formattedFocusTimeSpent = formatFocusTimeSpent(totalFocusMinutes);
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
  const allTodaysTasksDone = hasTodayTasks && completed === todaysTasks.length;
  const heroCopy = getDashboardHeroCopy({
    phase: state.pomodoro.phase,
    allTodaysTasksDone,
    currentRoundTaskCount: currentRoundTasks.length,
  });
  const showCurrentRoundTasks = shouldShowCurrentRoundTasks(state.pomodoro.phase);

  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
  const [completedHistoryIndex, setCompletedHistoryIndex] = useState(0);

  const categoryTotals = useMemo(() => getCategoryTotals(state.tasks, HISTORY_WINDOW_DAYS), [state.tasks]);

  const completedTaskHistory = useMemo(() => getCompletedTaskHistory(state.tasks, HISTORY_WINDOW_DAYS), [state.tasks]);

  useEffect(() => {
    if (completedHistoryIndex > completedTaskHistory.length - 1) {
      setCompletedHistoryIndex(0);
    }
  }, [completedHistoryIndex, completedTaskHistory.length]);

  const selectedHistoryDay = completedTaskHistory[completedHistoryIndex] ?? null;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return getGreeting(hour);
  }, []);

  const isOnOldestHistoryDay = completedHistoryIndex >= completedTaskHistory.length - 1;
  const isOnMostRecentHistoryDay = completedHistoryIndex === 0;

  const handleOpenOlderHistoryDay = () => {
    setCompletedHistoryIndex((current) => Math.min(current + 1, completedTaskHistory.length - 1));
  };

  const handleOpenNewerHistoryDay = () => {
    setCompletedHistoryIndex((current) => Math.max(current - 1, 0));
  };

  const interactiveStatCardSx = {
    flex: 1,
    minWidth: { xs: '100%', sm: 0 },
    cursor: 'pointer',
    border: '1px solid',
    borderColor: 'divider',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 4,
      borderColor: 'primary.main',
    },
  } as const;

  const renderTaskStatusIcon = (isDone: boolean, color: string) => (isDone
    ? <CheckCircleRounded sx={{ color }} fontSize="small" />
    : <CircleOutlined sx={{ color }} fontSize="small" />);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3">{greeting}, {state.userName}</Typography>
        <Typography color="text.secondary">Pick a round and use focused attention blocks to move through small, manageable tasks.</Typography>
      </Box>

      <Card sx={{ background: 'radial-gradient(circle at 65% 40%, rgba(145,247,142,0.28), rgba(14,14,14,1) 60%)' }}>
        <CardContent>
          <Typography variant="overline" color="primary.main" letterSpacing="0.08em">
            {heroCopy.overline}
          </Typography>
          <Typography variant="h4" mt={1} mb={2}>
            {heroCopy.title}
          </Typography>
          {allTodaysTasksDone ? (
            <Typography color="text.secondary" mb={2}>
              Great job. You finished every planned task for today, so you can stop for today.
            </Typography>
          ) : showCurrentRoundTasks && currentRoundTasks.length > 0 ? (
            <>
              <Typography color="text.secondary" mb={2}>These tasks are queued for your current round.</Typography>
              <Stack spacing={1.25} mb={2.5}>
                {currentRoundTasks.map((task) => (
                  <Stack key={task.id} direction="row" spacing={1} alignItems="center">
                    {renderTaskStatusIcon(task.status === 'done', 'primary.main')}
                    <Typography>{task.title}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button size="large" variant="contained" startIcon={<PlayArrowRounded />} onClick={() => navigate('/focus')}>
                Open timer
              </Button>
            </>
          ) : (
            <>
              <Typography color="text.secondary" mb={2}>
                {state.pomodoro.phase !== 'work'
                  ? 'You are currently on a break. Round planning resumes after your break ends.'
                  : hasTodayTasks
                  ? 'Assign tasks to this round before starting your next round.'
                  : 'Add tasks to Today\'s Tasks first, then assign them into a round.'}
              </Typography>
              {state.pomodoro.phase === 'work' && (
                <Button
                  size="large"
                  variant="contained"
                  startIcon={<PlayArrowRounded />}
                  onClick={() => navigate(hasTodayTasks ? '/rounds' : '/tasks')}
                >
                  {hasTodayTasks ? 'Assign tasks' : 'Add tasks'}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {!allTodaysTasksDone && (
        <Card sx={{ background: 'radial-gradient(circle at 65% 40%, rgba(96,174,255,0.30), rgba(14,14,14,1) 60%)' }}>
          <CardContent>
            <Typography variant="overline" color="#60aeff" letterSpacing="0.08em">
              Next round
            </Typography>
            <Typography variant="h5" mt={1} mb={2}>
              {nextRoundTasks.length > 0 ? 'Planned tasks for the next round' : 'No tasks planned for the next round yet'}
            </Typography>
            {nextRoundTasks.length > 0 ? (
              <Stack spacing={1.25}>
                {nextRoundTasks.map((task) => (
                  <Stack key={task.id} direction="row" spacing={1} alignItems="center">
                    {renderTaskStatusIcon(task.status === 'done', '#60aeff')}
                    <Typography>{task.title}</Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                {hasTodayTasks
                  ? 'Assign tasks to a later round so they are ready when this round ends.'
                  : 'Add tasks first, then assign them into your next round.'}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Card
        onClick={() => navigate('/tasks')}
        sx={{ cursor: 'pointer' }}
      >
        <CardContent>
          <Typography color="text.secondary">Today&apos;s planned tasks completed</Typography>
          <Typography variant="h3" color="primary.main">{progress}%</Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 99 }} />
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Card
          onClick={() => navigate('/tasks')}
          sx={interactiveStatCardSx}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: '0.82rem', sm: '0.92rem' }, lineHeight: 1.2, whiteSpace: 'nowrap' }}
              >
                Tasks completed today
              </Typography>
              <ChevronRightRounded color="primary" fontSize="small" />
            </Stack>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{completed} / {todaysTasks.length}</Typography>
          </CardContent>
        </Card>
        <Card
          onClick={() => navigate('/rounds')}
          sx={interactiveStatCardSx}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.82rem', sm: '0.92rem' },
                  lineHeight: 1.2,
                  whiteSpace: { xs: 'normal', sm: 'nowrap' },
                }}
              >
                Focused time spent
              </Typography>
              <ChevronRightRounded color="primary" fontSize="small" />
            </Stack>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{formattedFocusTimeSpent}</Typography>
          </CardContent>
        </Card>
        <Card
          onClick={() => navigate('/rounds')}
          sx={interactiveStatCardSx}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: '0.82rem', sm: '0.92rem' }, lineHeight: 1.2, whiteSpace: 'nowrap' }}
              >
                Sessions completed today
              </Typography>
              <ChevronRightRounded color="primary" fontSize="small" />
            </Stack>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2.125rem' } }}>{sessionsCompletedToday}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card
        onClick={() => navigate('/tasks?day=tomorrow')}
        sx={{
          cursor: 'pointer',
          background: 'radial-gradient(circle at 72% 38%, rgba(201,125,255,0.28), rgba(14,14,14,1) 62%)',
        }}
      >
        <CardContent>
          <Typography variant="overline" color="#c97dff" letterSpacing="0.08em">
            Tomorrow
          </Typography>
          <Typography variant="h5" mt={1} mb={1.5}>
            Tasks planned for tomorrow
          </Typography>
          <Typography variant="h4" color="#c97dff" mb={tomorrowTasks.length > 0 ? 1 : 0}>{tomorrowTasks.length}</Typography>
          {tomorrowTasks.length > 0 ? (
            <Stack spacing={0.75}>
              {tomorrowTasks.slice(0, 3).map((task) => (
                <Stack key={task.id} direction="row" spacing={1} alignItems="center">
                  {renderTaskStatusIcon(task.status === 'done', '#c97dff')}
                  <Typography color="text.secondary">{task.title}</Typography>
                </Stack>
              ))}
              {tomorrowTasks.length > 3 && <Typography color="text.secondary">+{tomorrowTasks.length - 3} more</Typography>}
            </Stack>
          ) : (
            <Typography color="text.secondary">No tasks planned for tomorrow yet.</Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={{ border: '1px solid', borderColor: isInsightsExpanded ? 'primary.main' : 'divider' }}>
        <CardContent>
          <ButtonBase
            aria-label={isInsightsExpanded ? 'Collapse insights' : 'Expand insights'}
            onClick={() => setIsInsightsExpanded((current) => !current)}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              textAlign: 'left',
              borderRadius: 1,
              p: 0.5,
              mx: -0.5,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <InsightsOutlined color="primary" />
              <Box>
                <Typography variant="h5">Insights</Typography>
                <Typography color="text.secondary">Review completed task history by day.</Typography>
              </Box>
            </Stack>
            <UnfoldMoreIcon color="primary" sx={{ alignSelf: 'flex-start', mr: -0.25 }} />
          </ButtonBase>

          {isInsightsExpanded && (
            <Stack spacing={2.5} mt={2.5}>
              <Card variant="outlined" sx={{ borderColor: 'primary.main', backgroundColor: 'rgba(145,247,142,0.08)' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <Typography variant="h6">Completed tasks by day</Typography>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        aria-label="Show older completed tasks"
                        size="small"
                        disabled={completedTaskHistory.length === 0 || isOnOldestHistoryDay}
                        onClick={handleOpenOlderHistoryDay}
                      >
                        <KeyboardArrowLeftRounded />
                      </IconButton>
                      <IconButton
                        aria-label="Show newer completed tasks"
                        size="small"
                        disabled={completedTaskHistory.length === 0 || isOnMostRecentHistoryDay}
                        onClick={handleOpenNewerHistoryDay}
                      >
                        <KeyboardArrowRightRounded />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {selectedHistoryDay ? (
                    <>
                      <Typography color="text.secondary" mb={1.5}>{formatHistoryDayLabel(selectedHistoryDay.dayKey)}</Typography>
                      <Stack spacing={1}>
                        {selectedHistoryDay.tasks.map((task) => (
                          <Stack key={task.id} direction="row" spacing={1} alignItems="center">
                            <CheckCircleRounded color="primary" fontSize="small" />
                            <Typography>{task.title}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <Typography color="text.secondary">No completed tasks in the last 30 days yet.</Typography>
                  )}
                </CardContent>
              </Card>

              <Box>
                <Typography variant="h6" mb={1}>Completed tasks split by category (last 30 days)</Typography>
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
                    <Typography color="text.secondary">No completed tasks in the last 30 days yet.</Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};
