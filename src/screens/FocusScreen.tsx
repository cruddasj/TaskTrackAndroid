import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const FocusScreen = () => {
  const navigate = useNavigate();
  const { state, startPomodoro, pausePomodoro, resetPomodoro } = useAppState();

  const activeTask = useMemo(
    () => state.tasks.find((task) => task.id === state.pomodoro.activeTaskId) ?? state.tasks[0],
    [state.tasks, state.pomodoro.activeTaskId],
  );

  const progress = ((state.pomodoro.totalSeconds - state.pomodoro.remainingSeconds) / state.pomodoro.totalSeconds) * 100;
  const circumference = 2 * Math.PI * 140;
  const dashoffset = circumference - (progress / 100) * circumference;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack
        spacing={{ xs: 2, md: 3 }}
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: '100%', maxWidth: 980, height: '100%', maxHeight: 'calc(100dvh - 32px)' }}
      >
        <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" px={{ xs: 0.5, md: 1 }}>
          <Typography variant="h5" color="primary.main" fontWeight={800}>Deep Focus Mode</Typography>
          <Chip label="Exit Focus" onClick={() => navigate('/rounds')} sx={{ px: 0.5 }} />
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
          <Stack position="absolute" sx={{ inset: 0, px: 2 }} alignItems="center" justifyContent="center">
            <Typography variant="h1" fontSize={{ xs: 82, md: 88 }} fontWeight={800}>{formatTime(state.pomodoro.remainingSeconds)}</Typography>
            <Typography color="text.secondary" letterSpacing="0.1em">REMAINING</Typography>
          </Stack>
        </Box>

        <Stack spacing={1} alignItems="center" px={1}>
          <Typography variant="h4" textAlign="center">{activeTask?.title ?? 'No task selected'}</Typography>
          <Typography color="text.secondary">Part of: {activeTask?.category ?? 'General'}</Typography>
        </Stack>

        <Stack direction="row" spacing={3} alignItems="center" pb={1}>
          <IconButton sx={{ bgcolor: '#1a1a1a' }} onClick={resetPomodoro}><ReplayRounded /></IconButton>
          <IconButton
            onClick={() =>
              state.pomodoro.isRunning
                ? pausePomodoro()
                : startPomodoro(
                    activeTask?.id ?? state.tasks[0]?.id ?? '',
                    activeTask?.roundId,
                    state.settings.pomodoroMinutes,
                  )
            }
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 88, height: 88, '&:hover': { bgcolor: 'primary.main' } }}
          >
            {state.pomodoro.isRunning ? <PauseRounded fontSize="large" /> : <PlayArrowRounded fontSize="large" />}
          </IconButton>
          <IconButton sx={{ bgcolor: '#1a1a1a' }} onClick={() => navigate('/tasks-today')}><SkipNextRounded /></IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};
