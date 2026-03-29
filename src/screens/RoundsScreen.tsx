import CircleOutlined from '@mui/icons-material/CircleOutlined';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

export const RoundsScreen = () => {
  const { state, assignTasksToRound, startPomodoro } = useAppState();
  const navigate = useNavigate();
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const editingRound = useMemo(
    () => state.rounds.find((round) => round.id === editingRoundId),
    [state.rounds, editingRoundId],
  );
  const totalSelectedMinutes = useMemo(
    () =>
      selectedTaskIds.reduce((total, taskId) => {
        const task = state.tasks.find((candidate) => candidate.id === taskId);
        return total + (task?.estimateMinutes ?? 0);
      }, 0),
    [selectedTaskIds, state.tasks],
  );

  const openRoundAssignment = (roundId: string) => {
    const round = state.rounds.find((item) => item.id === roundId);
    if (!round) return;
    setEditingRoundId(roundId);
    setSelectedTaskIds(round.taskIds);
  };

  const saveAssignment = () => {
    if (!editingRoundId) return;
    assignTasksToRound(editingRoundId, selectedTaskIds);
    setEditingRoundId(null);
    setSelectedTaskIds([]);
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Today's Rounds</Typography>
        <Typography color="text.secondary">Manage your focus sessions for the day.</Typography>
      </Box>
      {state.rounds.map((round) => (
        <Card key={round.id} sx={{ bgcolor: round.status === 'active' ? '#20201f' : '#1a1a1a' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h5">{round.title} ({state.settings.pomodoroMinutes} min)</Typography>
            </Stack>
            <Stack spacing={1} mb={2}>
              {round.taskIds.map((taskId) => {
                const task = state.tasks.find((candidate) => candidate.id === taskId);
                if (!task) return null;
                return (
                  <Stack direction="row" spacing={1} alignItems="center" key={task.id}>
                    <CircleOutlined fontSize="small" color={task.status === 'done' ? 'success' : 'disabled'} />
                    <Typography>{task.title}</Typography>
                  </Stack>
                );
              })}
              {round.taskIds.length === 0 && <Typography color="text.secondary">No tasks assigned yet.</Typography>}
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => openRoundAssignment(round.id)}>
                Assign tasks
              </Button>
              {round.status === 'active' && (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowRounded />}
                  onClick={() => {
                    const firstTaskId = round.taskIds[0] ?? state.tasks[0]?.id;
                    if (!firstTaskId) return;
                    startPomodoro(firstTaskId, round.id, state.settings.pomodoroMinutes);
                    navigate('/focus');
                  }}
                >
                  Enter Focus Mode
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
      <Dialog
        open={!!editingRound}
        onClose={() => setEditingRoundId(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign tasks to {editingRound?.title}</DialogTitle>
        <DialogContent>
          <Stack mt={0.5}>
            {state.tasks.length === 0 && (
              <Typography color="text.secondary">No tasks in today&apos;s list yet. Add from Task Bank first.</Typography>
            )}
            {state.tasks.map((task) => (
              <FormControlLabel
                key={task.id}
                control={(
                  <Checkbox
                    checked={selectedTaskIds.includes(task.id)}
                    onChange={(_, checked) =>
                      setSelectedTaskIds((current) =>
                        checked ? [...current, task.id] : current.filter((id) => id !== task.id),
                      )
                    }
                  />
                )}
                label={`${task.title} (${task.estimateMinutes} min)`}
              />
            ))}
          </Stack>
          {totalSelectedMinutes > state.settings.pomodoroMinutes && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Total selected time is {totalSelectedMinutes} min, which is above your recommended pomodoro length of{' '}
              {state.settings.pomodoroMinutes} min.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRoundId(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveAssignment}>Save assignment</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
