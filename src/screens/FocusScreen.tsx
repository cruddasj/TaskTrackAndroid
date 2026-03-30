import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { getCarryForwardRound, getVisibleRoundId } from '../state/rounds';
import { areAllTasksCompletedForDate } from '../state/tasks';
import { formatTime, getTodayKey } from '../utils';

export const FocusScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, startPomodoro, pausePomodoro, skipPomodoro, resetPomodoro, toggleTask, assignTasksToRound, createRound } = useAppState();
  const [sessionReviewOpen, setSessionReviewOpen] = useState(false);
  const [confirmedDoneIds, setConfirmedDoneIds] = useState<string[]>([]);
  const requestedRoundId = searchParams.get('roundId') ?? undefined;
  const visibleRoundId = getVisibleRoundId(state.rounds, requestedRoundId, state.pomodoro.activeRoundId);

  const activeRound = useMemo(
    () => state.rounds.find((round) => round.id === visibleRoundId),
    [state.rounds, visibleRoundId],
  );

  const roundTasks = useMemo(() => {
    if (activeRound) {
      return activeRound.taskIds
        .map((taskId) => state.tasks.find((task) => task.id === taskId))
        .filter((task): task is NonNullable<typeof task> => !!task);
    }

    return [];
  }, [activeRound, state.tasks]);

  const activeTask = useMemo(
    () => state.tasks.find((task) => task.id === state.pomodoro.activeTaskId) ?? roundTasks[0],
    [state.tasks, state.pomodoro.activeTaskId, roundTasks],
  );

  const unfinishedRoundTasks = useMemo(
    () => roundTasks.filter((task) => task.status !== 'done'),
    [roundTasks],
  );

  const allTodaysTasksDone = areAllTasksCompletedForDate(state.tasks, getTodayKey());

  useEffect(() => {
    if (state.pomodoro.remainingSeconds !== 0 || state.pomodoro.isRunning || unfinishedRoundTasks.length === 0) return;
    setConfirmedDoneIds(roundTasks.filter((task) => task.status === 'done').map((task) => task.id));
    setSessionReviewOpen(true);
  }, [state.pomodoro.remainingSeconds, state.pomodoro.isRunning, unfinishedRoundTasks.length, roundTasks]);

  const handleSkip = () => {
    if (state.pomodoro.phase !== 'work') {
      skipPomodoro();
      return;
    }

    if (allTodaysTasksDone) {
      resetPomodoro();
      navigate('/');
      return;
    }

    if (unfinishedRoundTasks.length === 0) {
      skipPomodoro();
      return;
    }

    setConfirmedDoneIds(roundTasks.filter((task) => task.status === 'done').map((task) => task.id));
    setSessionReviewOpen(true);
  };

  const progress = ((state.pomodoro.totalSeconds - state.pomodoro.remainingSeconds) / state.pomodoro.totalSeconds) * 100;
  const circumference = 2 * Math.PI * 140;
  const dashoffset = circumference - (progress / 100) * circumference;

  const confirmSessionRollover = () => {
    const confirmedDoneSet = new Set(confirmedDoneIds);
    roundTasks.forEach((task) => {
      const shouldBeDone = confirmedDoneSet.has(task.id);
      if ((shouldBeDone && task.status !== 'done') || (!shouldBeDone && task.status === 'done')) {
        toggleTask(task.id);
      }
    });

    if (!activeRound) {
      setSessionReviewOpen(false);
      return;
    }

    const carryForwardIds = roundTasks.filter((task) => !confirmedDoneSet.has(task.id)).map((task) => task.id);
    if (carryForwardIds.length > 0) {
      const nextRound = getCarryForwardRound(state.rounds, activeRound.id);
      const targetRoundId = nextRound?.id ?? createRound();
      const targetRoundTaskIds = nextRound?.taskIds ?? [];
      assignTasksToRound(targetRoundId, Array.from(new Set([...targetRoundTaskIds, ...carryForwardIds])));
    }

    setSessionReviewOpen(false);
    skipPomodoro();
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        px: { xs: 2, sm: 3, md: 4 },
        pt: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'center',
      }}
    >
      <Stack
        spacing={{ xs: 2, md: 3 }}
        alignItems="center"
        justifyContent="space-between"
        sx={{
          width: '100%',
          maxWidth: 980,
          pb: { xs: 2, md: 0 },
        }}
      >
        <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" px={{ xs: 0.5, md: 1 }}>
          <Typography variant="h5" color="primary.main" fontWeight={800}>Active Session</Typography>
          <Chip label="Close" onClick={() => navigate('/rounds')} sx={{ px: 0.5 }} />
        </Box>

        <Box position="relative" width={{ xs: 300, md: 340 }} height={{ xs: 300, md: 340 }}>
          <svg width="100%" height="100%" viewBox="0 0 320 320">
            <circle cx="160" cy="160" r="140" stroke="#2a2a2a" strokeWidth="8" fill="none" />
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="#91f78e"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 160 160)"
            />
          </svg>
          <Stack position="absolute" sx={{ inset: 0, px: { xs: 3.5, md: 4 } }} alignItems="center" justifyContent="center">
            <Typography variant="h1" fontSize={{ xs: 76, md: 88 }} fontWeight={800}>{formatTime(state.pomodoro.remainingSeconds)}</Typography>
            <Typography color="text.secondary" letterSpacing="0.1em">REMAINING</Typography>
          </Stack>
        </Box>

        <Stack spacing={1} alignItems="center" px={1}>
          <Typography color="primary.main" fontWeight={700} letterSpacing="0.08em">
            {state.pomodoro.phase === 'work' ? 'FOCUS' : state.pomodoro.phase === 'short_break' ? 'SHORT BREAK' : 'LONG BREAK'}
          </Typography>
          <Typography variant="h4" textAlign="center">{state.pomodoro.phase === 'work' ? activeRound?.title ?? 'No round selected' : 'Break time'}</Typography>
        </Stack>

        {state.pomodoro.phase === 'work' ? (
          <Card sx={{ width: '100%', maxWidth: 780, maxHeight: { xs: 220, md: 280 }, overflow: 'hidden' }}>
            <CardContent>
              <Stack spacing={1} sx={{ maxHeight: '100%', overflowY: 'auto', pr: 0.5 }}>
                <Typography variant="h6">Tasks in this session</Typography>
                {roundTasks.map((task) => (
                  <Stack key={task.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography>{task.title}</Typography>
                    <Button
                      size="small"
                      startIcon={task.status === 'done' ? <CheckCircleOutlineRounded /> : <RadioButtonUncheckedRounded />}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.status === 'done' ? 'Done' : 'Mark done'}
                    </Button>
                  </Stack>
                ))}
                {roundTasks.length === 0 && <Typography color="text.secondary">No tasks assigned to this session yet.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="success" sx={{ width: '100%', maxWidth: 780 }}>
            Break in progress. Tasks are hidden until your next focus session starts.
          </Alert>
        )}

        <Stack direction="row" spacing={3} alignItems="center" pb={2}>
          <IconButton sx={{ bgcolor: '#1a1a1a' }} onClick={resetPomodoro}><ReplayRounded /></IconButton>
          <IconButton
            onClick={() =>
              state.pomodoro.isRunning
                ? pausePomodoro()
                : startPomodoro(
                    activeTask?.id ?? state.tasks[0]?.id ?? '',
                    activeRound?.id ?? activeTask?.roundId,
                    state.settings.pomodoroMinutes,
                  )
            }
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 88, height: 88, '&:hover': { bgcolor: 'primary.main' } }}
          >
            {state.pomodoro.isRunning ? <PauseRounded fontSize="large" /> : <PlayArrowRounded fontSize="large" />}
          </IconButton>
          <IconButton sx={{ bgcolor: '#1a1a1a' }} onClick={handleSkip}><SkipNextRounded /></IconButton>
        </Stack>
      </Stack>

      <Dialog open={sessionReviewOpen} onClose={() => setSessionReviewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Session complete: confirm unfinished tasks</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={2}>
            Mark anything you completed. Tasks left unfinished will move into your next focus round automatically.
          </Typography>
          <Stack spacing={1}>
            {roundTasks.map((task) => {
              const checked = confirmedDoneIds.includes(task.id);
              return (
                <Button
                  key={task.id}
                  variant={checked ? 'contained' : 'outlined'}
                  onClick={() =>
                    setConfirmedDoneIds((current) =>
                      checked ? current.filter((id) => id !== task.id) : [...current, task.id],
                    )
                  }
                >
                  {checked ? 'Finished' : 'Unfinished'} · {task.title}
                </Button>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionReviewOpen(false)}>Review later</Button>
          <Button variant="contained" onClick={confirmSessionRollover}>Confirm and continue</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
