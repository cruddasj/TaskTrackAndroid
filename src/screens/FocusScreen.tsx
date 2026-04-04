import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import CircleOutlined from '@mui/icons-material/CircleOutlined';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Snackbar, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { getCarryForwardRound, getRoundPlannedDate, getVisibleRoundId } from '../state/rounds';
import { areAllTasksCompletedForDate } from '../state/tasks';
import type { Task } from '../types';
import { formatRemainingEndTime, formatTime, getTodayKey } from '../utils';
import { canMarkTaskDone, getMarkTaskDoneBlockedMessage } from './focusTaskToggle';
import { getWorkSkipOutcome } from './focusSkip';

export const FocusScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    state,
    startPomodoro,
    pausePomodoro,
    skipPomodoro,
    resetPomodoro,
    toggleTask,
    assignTasksToRound,
    createRound,
    showSuccessMessage,
    successMessage,
    clearSuccessMessage,
  } = useAppState();
  const [sessionReviewOpen, setSessionReviewOpen] = useState(false);
  const [confirmedDoneIds, setConfirmedDoneIds] = useState<string[]>([]);
  const requestedRoundId = searchParams.get('roundId') ?? undefined;
  const todayKey = getTodayKey();
  const todayRounds = useMemo(
    () => state.rounds.filter((round) => getRoundPlannedDate(round) === todayKey),
    [state.rounds, todayKey],
  );
  const visibleRoundId = getVisibleRoundId(todayRounds, requestedRoundId, state.pomodoro.activeRoundId);

  const activeRound = useMemo(
    () => todayRounds.find((round) => round.id === visibleRoundId),
    [todayRounds, visibleRoundId],
  );

  const roundTasks = useMemo(() => {
    if (activeRound) {
      return activeRound.taskIds.reduce<Task[]>((acc, taskId) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) acc.push(task);
        return acc;
      }, []);
    }

    return [];
  }, [activeRound, state.tasks]);

  const activeTask = useMemo(
    () => (state.pomodoro.activeTaskId ? state.tasks.find((task) => task.id === state.pomodoro.activeTaskId) : undefined) ?? roundTasks[0],
    [state.tasks, state.pomodoro.activeTaskId, roundTasks],
  );

  const unfinishedRoundTasks = useMemo(
    () => roundTasks.filter((task) => task.status !== 'done'),
    [roundTasks],
  );

  const allTodaysTasksDone = areAllTasksCompletedForDate(state.tasks, todayKey);
  const canMarkTasksDone = canMarkTaskDone(state.pomodoro.isRunning);
  const blockedTaskDoneMessage = getMarkTaskDoneBlockedMessage(state.pomodoro.isRunning);

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

    const workSkipOutcome = getWorkSkipOutcome({
      allTodaysTasksDone,
      unfinishedRoundTaskCount: unfinishedRoundTasks.length,
    });

    if (workSkipOutcome === 'advance_only') {
      skipPomodoro();
      return;
    }

    if (workSkipOutcome === 'advance_then_reset') {
      skipPomodoro();
      resetPomodoro();
      navigate('/');
      return;
    }

    setConfirmedDoneIds(roundTasks.filter((task) => task.status === 'done').map((task) => task.id));
    setSessionReviewOpen(true);
  };

  const confirmSessionRollover = useCallback(() => {
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
      const nextRound = getCarryForwardRound(todayRounds, activeRound.id);
      const targetRoundId = nextRound?.id ?? createRound({ plannedDate: todayKey });
      const targetRoundTaskIds = nextRound?.taskIds ?? [];
      assignTasksToRound(targetRoundId, Array.from(new Set([...targetRoundTaskIds, ...carryForwardIds])));
    }

    setSessionReviewOpen(false);
    skipPomodoro();
  }, [roundTasks, confirmedDoneIds, activeRound, todayRounds, assignTasksToRound, createRound, skipPomodoro, toggleTask, todayKey]);

  useEffect(() => {
    if (!sessionReviewOpen) return;
    const timeoutId = window.setTimeout(() => {
      confirmSessionRollover();
    }, state.settings.sessionReviewGraceSeconds * 1000);
    return () => window.clearTimeout(timeoutId);
  }, [sessionReviewOpen, confirmSessionRollover, state.settings.sessionReviewGraceSeconds]);

  const progress = state.pomodoro.totalSeconds > 0
    ? ((state.pomodoro.totalSeconds - state.pomodoro.remainingSeconds) / state.pomodoro.totalSeconds) * 100
    : 0;
  const circumference = 2 * Math.PI * 140;
  const dashoffset = circumference - (progress / 100) * circumference;

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
        spacing={2}
        sx={{
          width: '100%',
          pb: 2,
        }}
      >
        <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-start" px={0.5}>
          <Box>
            <Typography variant="h5" color="primary.main" fontWeight={800} lineHeight={1.2}>
              Active round
            </Typography>
            <Typography variant="h5" color="primary.main" fontWeight={800} lineHeight={1.2}>
              {state.pomodoro.phase === 'work' ? `(${activeRound?.title ?? 'No round selected'})` : '(Break)'}
            </Typography>
          </Box>
          <Chip label="Close" size="small" onClick={() => navigate('/rounds')} sx={{ px: 0.5, mt: 0.5 }} />
        </Box>

        <Stack direction="column" spacing={2} alignItems="center">
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: '100%' }}
          >
            <Box position="relative" width={300} height={300}>
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
              <Stack position="absolute" sx={{ inset: 0, px: 3.5 }} alignItems="center" justifyContent="center">
                <Typography variant="h1" fontSize={76} fontWeight={800}>{formatTime(state.pomodoro.remainingSeconds)}</Typography>
                <Typography color="text.secondary" letterSpacing="0.1em">Remaining</Typography>
                <Typography variant="body2" color="text.secondary">
                  Finishes at {formatRemainingEndTime(state.pomodoro.remainingSeconds)}
                </Typography>
              </Stack>
            </Box>

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

          {state.pomodoro.phase === 'work' ? (
            <Card sx={{ width: '100%', maxHeight: 220, overflow: 'hidden', alignSelf: 'stretch' }}>
              <CardContent sx={{ height: '100%' }}>
                <Stack spacing={1} sx={{ maxHeight: '100%', overflowY: 'auto', pr: 0.5 }}>
                  <Typography variant="h6">Tasks in this round</Typography>
                  {roundTasks.map((task) => (
                    <Stack key={task.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography>{task.title}</Typography>
                      <Button
                        size="small"
                        startIcon={task.status === 'done' ? <CheckCircleRounded color="success" /> : <CircleOutlined color="disabled" />}
                        onClick={() => {
                          if (!canMarkTasksDone) {
                            if (blockedTaskDoneMessage) {
                              showSuccessMessage(blockedTaskDoneMessage);
                            }
                            return;
                          }
                          toggleTask(task.id);
                        }}
                      >
                        {task.status === 'done' ? 'Done' : 'Mark done'}
                      </Button>
                    </Stack>
                  ))}
                  {roundTasks.length === 0 && <Typography color="text.secondary">No tasks assigned to this round yet.</Typography>}
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Alert
              severity="success"
              icon={false}
              sx={{
                width: '100%',
                alignSelf: 'center',
                justifyContent: 'center',
                '& .MuiAlert-message': { width: '100%', textAlign: 'center' },
              }}
            >
              Break in progress. Tasks are hidden until your next round starts.
            </Alert>
          )}
        </Stack>
      </Stack>

      <Dialog open={sessionReviewOpen} onClose={() => setSessionReviewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Round complete: confirm unfinished tasks</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={2}>
            Mark anything you completed. Tasks left unfinished will move into your next focus round automatically.
            If you do not confirm in time, this step continues automatically based on your Settings timeout.
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
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="contained" fullWidth onClick={confirmSessionRollover}>
            Confirm and continue
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={2500}
        onClose={clearSuccessMessage}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      />
    </Box>
  );
};
