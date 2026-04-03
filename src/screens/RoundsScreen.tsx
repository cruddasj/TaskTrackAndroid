import CircleOutlined from '@mui/icons-material/CircleOutlined';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import ArrowDropDownRounded from '@mui/icons-material/ArrowDropDownRounded';
import ArrowDropUpRounded from '@mui/icons-material/ArrowDropUpRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import {
  getCarryHistoryForRound,
  getDefaultRoundTitle,
  getRoundEstimatedMinutes,
  getRoundTaskIdsForDisplay,
  hasEmptyRoundWithoutTasks,
  isRoundCompleted,
} from '../state/rounds';
import { getTodayKey, getTomorrowKey } from '../utils';
import { PlanningDayOption, PlanningDayToggle } from '../components/PlanningDayToggle';
import { shouldShowCategoryGroupingSuggestion } from './roundsScreenVisibility';

export const RoundsScreen = () => {
  const { state, assignTasksToRound, autoGroupTasksForDate, moveRound, createRound, deleteRound, updateRoundTitle, showSuccessMessage } = useAppState();
  const [planningDay, setPlanningDay] = useState<PlanningDayOption>('today');
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [createRoundOpen, setCreateRoundOpen] = useState(false);
  const [newRoundTitle, setNewRoundTitle] = useState('');
  const [newRoundTaskIds, setNewRoundTaskIds] = useState<string[]>([]);
  const [renameRoundId, setRenameRoundId] = useState<string | null>(null);
  const [renameRoundTitle, setRenameRoundTitle] = useState('');
  const [roundPendingDelete, setRoundPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [roundCreationValidationMessage, setRoundCreationValidationMessage] = useState<string | null>(null);
  const selectedDateKey = planningDay === 'today' ? getTodayKey() : getTomorrowKey();
  const selectedDayLabel = planningDay === 'today' ? 'today' : 'tomorrow';
  const selectedDayTasks = useMemo(() => state.tasks.filter((task) => task.plannedDate === selectedDateKey), [state.tasks, selectedDateKey]);
  const selectedDayRounds = useMemo(() => state.rounds.filter((round) => round.plannedDate === selectedDateKey), [state.rounds, selectedDateKey]);

  const editingRound = useMemo(
    () => selectedDayRounds.find((round) => round.id === editingRoundId),
    [selectedDayRounds, editingRoundId],
  );
  const totalSelectedMinutes = useMemo(
    () =>
      selectedTaskIds.reduce((total, taskId) => {
        const task = selectedDayTasks.find((candidate) => candidate.id === taskId);
        return total + (task?.estimateMinutes ?? 0);
      }, 0),
    [selectedTaskIds, selectedDayTasks],
  );

  const openRoundAssignment = (roundId: string) => {
    const round = selectedDayRounds.find((item) => item.id === roundId);
    if (!round || isRoundCompleted(round)) return;
    setEditingRoundId(roundId);
    setSelectedTaskIds(round.taskIds);
  };

  const saveAssignment = () => {
    if (!editingRoundId) return;
    assignTasksToRound(editingRoundId, selectedTaskIds);
    showSuccessMessage('Round assignment saved.');
    setEditingRoundId(null);
    setSelectedTaskIds([]);
  };

  const availableTasks = useMemo(() => {
    return selectedDayTasks.filter((task) => !task.roundId || task.roundId === editingRound?.id);
  }, [selectedDayTasks, editingRound]);
  const orderedRounds = selectedDayRounds;
  const plannedRounds = useMemo(
    () => orderedRounds.filter((round) => round.status !== 'done'),
    [orderedRounds],
  );
  const unassignedTasks = useMemo(
    () => selectedDayTasks.filter((task) => !task.roundId || !selectedDayRounds.some((round) => round.id === task.roundId)),
    [selectedDayTasks, selectedDayRounds],
  );
  const showCategoryGroupingSuggestion = useMemo(
    () => shouldShowCategoryGroupingSuggestion(selectedDayTasks),
    [selectedDayTasks],
  );
  const roundEstimatedMinutes = useMemo(
    () =>
      state.rounds.reduce<Record<string, number>>((acc, round) => {
        acc[round.id] = getRoundEstimatedMinutes(round, selectedDayTasks);
        return acc;
      }, {}),
    [state.rounds, selectedDayTasks],
  );
  const openCreateRoundDialog = () => {
    const hasEmptyRound = hasEmptyRoundWithoutTasks(selectedDayRounds);
    if (hasEmptyRound) {
      setRoundCreationValidationMessage(
        'You already have a round without tasks. Assign tasks to that round before creating another one.',
      );
      return;
    }

    setNewRoundTitle(getDefaultRoundTitle(selectedDayRounds));
    setNewRoundTaskIds([]);
    setCreateRoundOpen(true);
    setRoundCreationValidationMessage(null);
    setEditingRoundId(null);
    setSelectedTaskIds([]);
  };
  const handleCreateRound = () => {
    const resolvedTitle = newRoundTitle.trim() || getDefaultRoundTitle(selectedDayRounds);
    createRound(selectedDateKey, { title: resolvedTitle, taskIds: newRoundTaskIds });
    setCreateRoundOpen(false);
    setNewRoundTitle('');
    setNewRoundTaskIds([]);
    showSuccessMessage('New round created.');
  };

  const openRenameDialog = (roundId: string, title: string) => {
    setRenameRoundId(roundId);
    setRenameRoundTitle(title);
  };

  const saveRename = () => {
    const nextTitle = renameRoundTitle.trim();
    if (!renameRoundId || !nextTitle) return;
    updateRoundTitle(renameRoundId, nextTitle);
    setRenameRoundId(null);
    setRenameRoundTitle('');
    showSuccessMessage('Round name updated.');
  };

  const confirmDeleteRound = () => {
    if (!roundPendingDelete) return;
    deleteRound(roundPendingDelete.id);
    showSuccessMessage(`${roundPendingDelete.title} deleted. Tasks moved to Unassigned tasks for ${selectedDayLabel}.`);
    setRoundPendingDelete(null);
  };

  const handleQuickAssignToRound = (taskId: string, event: SelectChangeEvent<string>) => {
    const roundId = event.target.value;
    const targetRound = selectedDayRounds.find((round) => round.id === roundId);
    if (!targetRound || isRoundCompleted(targetRound)) return;
    const nextTaskIds = targetRound.taskIds.includes(taskId) ? targetRound.taskIds : [...targetRound.taskIds, taskId];
    assignTasksToRound(roundId, nextTaskIds);
    showSuccessMessage(`Assigned task to ${targetRound.title}.`);
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Rounds</Typography>
        <Typography color="text.secondary">Group {selectedDayLabel}&apos;s tasks into rounds, then reorder rounds with the arrows.</Typography>
        <PlanningDayToggle value={planningDay} onChange={setPlanningDay} />
      </Box>
      {roundCreationValidationMessage && <Alert severity="warning">{roundCreationValidationMessage}</Alert>}
      {planningDay === 'tomorrow' && (
        <Alert severity="success" sx={{ bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } }}>
          Tomorrow&apos;s rounds are for planning only. You can start rounds only when they become today&apos;s rounds.
        </Alert>
      )}
      {showCategoryGroupingSuggestion && (
        <Box>
          <Button
            variant="outlined"
            onClick={() => {
              autoGroupTasksForDate(selectedDateKey);
              showSuccessMessage('Suggested rounds generated by category.');
            }}
          >
            Suggest groupings by category
          </Button>
        </Box>
      )}
      <Card sx={{ bgcolor: '#1a1a1a' }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Unassigned tasks for {selectedDayLabel}</Typography>
          <Stack spacing={1}>
            {unassignedTasks.map((task) => (
              <Stack direction="row" spacing={1} alignItems="center" key={task.id}>
                <CircleOutlined fontSize="small" color="disabled" />
                <Typography sx={{ flex: 1 }}>{task.title}</Typography>
                <Select
                  size="small"
                  displayEmpty
                  value=""
                  disabled={plannedRounds.length === 0}
                  onChange={(event) => handleQuickAssignToRound(task.id, event)}
                  sx={{ minWidth: 164 }}
                  aria-label={`quick-assign-${task.id}`}
                >
                  <MenuItem value="" disabled>Assign to round</MenuItem>
                  {plannedRounds.map((round) => (
                    <MenuItem key={round.id} value={round.id}>{round.title}</MenuItem>
                  ))}
                </Select>
              </Stack>
            ))}
            {unassignedTasks.length === 0 && (
              <Typography color="text.secondary">
                {selectedDayTasks.length === 0
                  ? `No tasks in ${selectedDayLabel}'s Tasks yet.`
                  : `All ${selectedDayLabel}'s tasks are assigned to a round.`}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
      {orderedRounds.map((round) => {
        const displayTaskIds = getRoundTaskIdsForDisplay(round, selectedDayTasks);
        const estimatedMinutes = roundEstimatedMinutes[round.id] ?? 0;
        const roundDetails = round.status === 'done'
          ? `${round.durationMinutes} min completed`
          : `Estimated ${estimatedMinutes} min`;
        return (
          <Card
          key={round.id}
          sx={{
            bgcolor: round.status === 'active' ? '#20201f' : round.status === 'done' ? '#131313' : '#1a1a1a',
            opacity: round.status === 'done' ? 0.75 : 1,
          }}
          >
            <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} spacing={1}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Stack spacing={0}>
                  <Typography variant="h5">
                    {round.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {roundDetails}
                  </Typography>
                </Stack>
                {estimatedMinutes > state.settings.pomodoroMinutes && (
                  <WarningAmberRounded color="warning" fontSize="small" aria-label={`round-overflow-warning-${round.id}`} />
                )}
              </Stack>
              {round.status === 'done' ? (
                <Chip
                  size="small"
                  color="success"
                  icon={<CheckCircleRounded />}
                  label="Completed"
                  aria-label={`completed-round-chip-${round.id}`}
                />
              ) : (
                <Stack direction="row" spacing={0.25}>
                  <>
                    <IconButton size="small" onClick={() => openRenameDialog(round.id, round.title)} aria-label={`rename-round-${round.id}`}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => {
                      setRoundPendingDelete({ id: round.id, title: round.title });
                    }} aria-label={`delete-round-${round.id}`}>
                      <DeleteOutlineRounded color="error" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveRound(round.id, 'up')} aria-label={`move-round-up-${round.id}`}>
                      <ArrowDropUpRounded />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveRound(round.id, 'down')} aria-label={`move-round-down-${round.id}`}>
                      <ArrowDropDownRounded />
                    </IconButton>
                  </>
                </Stack>
              )}
            </Stack>
              <Stack spacing={1} mb={2}>
                {displayTaskIds.map((taskId) => {
                const task = selectedDayTasks.find((candidate) => candidate.id === taskId);
                if (!task) return null;
                const { carriedFromRoundId, carriedToRoundId } = getCarryHistoryForRound(task, round.id);
                const carriedFromRound = carriedFromRoundId
                  ? state.rounds.find((candidate) => candidate.id === carriedFromRoundId)
                  : undefined;
                const carriedToRound = carriedToRoundId
                  ? state.rounds.find((candidate) => candidate.id === carriedToRoundId)
                  : undefined;
                const carriedMessage = carriedToRound
                  ? carriedFromRound
                    ? `(Not completed in this round, carried over from ${carriedFromRound.title} to ${carriedToRound.title})`
                    : `(Not completed in this round, carried over to ${carriedToRound.title})`
                  : null;
                return (
                  <Stack direction="row" spacing={1} alignItems="center" key={task.id}>
                    {task.status === 'done' && !carriedMessage
                      ? <CheckCircleRounded fontSize="small" color="success" />
                      : <CircleOutlined fontSize="small" color="disabled" />}
                    <Typography>
                      {task.title}
                      {carriedMessage ? ` ${carriedMessage}` : ''}
                    </Typography>
                  </Stack>
                );
              })}
                {displayTaskIds.length === 0 && <Typography color="text.secondary">No tasks assigned yet.</Typography>}
              </Stack>
              {(roundEstimatedMinutes[round.id] ?? 0) > state.settings.pomodoroMinutes && (
              <Alert severity="success" icon={<WarningAmberRounded color="warning" />}>
                This round is estimated at {roundEstimatedMinutes[round.id]} minutes, which is above your {state.settings.pomodoroMinutes}
                -minute round setting. Tasks will likely roll over into later rounds.
              </Alert>
            )}
            {round.status === 'done' ? (
              <Typography color="text.secondary">Completed round (read-only).</Typography>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                mt={(roundEstimatedMinutes[round.id] ?? 0) > state.settings.pomodoroMinutes ? 1 : 0}
              >
                <Button variant="outlined" onClick={() => openRoundAssignment(round.id)}>
                  {round.taskIds.length > 0 ? 'Edit tasks' : 'Assign tasks'}
                </Button>
              </Stack>
            )}
            </CardContent>
          </Card>
        );
      })}
      <Dialog
        open={!!editingRound}
        onClose={() => setEditingRoundId(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign tasks to {editingRound?.title}</DialogTitle>
        <DialogContent>
          <Stack mt={0.5}>
            {selectedDayTasks.length === 0 && (
              <Typography color="text.secondary">No tasks in selected day&apos;s Tasks yet. Add one from Task Bank first.</Typography>
            )}
            {availableTasks.length === 0 && selectedDayTasks.length > 0 && (
              <Typography color="text.secondary">All tasks are currently assigned to other rounds.</Typography>
            )}
            {availableTasks.map((task) => (
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
              Total selected time is {totalSelectedMinutes} min, which is above your recommended Pomodoro length of{' '}
              {state.settings.pomodoroMinutes} min.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRoundId(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveAssignment}>Save assignment</Button>
        </DialogActions>
      </Dialog>
      <IconButton
        color="primary"
        onClick={openCreateRoundDialog}
        size="large"
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          width: 64,
          height: 64,
          boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
          '&:hover': { bgcolor: 'primary.main' },
        }}
        aria-label="create-round"
      >
        <AddRounded />
      </IconButton>
      <Dialog open={createRoundOpen} onClose={() => setCreateRoundOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create round</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Round name"
            fullWidth
            value={newRoundTitle}
            onChange={(event) => setNewRoundTitle(event.target.value)}
          />
          <Typography variant="subtitle2" mt={1.5} mb={0.5}>Assign tasks now (optional)</Typography>
          <Stack>
            {unassignedTasks.length === 0 && (
              <Typography color="text.secondary">No unassigned tasks available.</Typography>
            )}
            {unassignedTasks.map((task) => (
              <FormControlLabel
                key={task.id}
                control={(
                  <Checkbox
                    checked={newRoundTaskIds.includes(task.id)}
                    onChange={(_, checked) =>
                      setNewRoundTaskIds((current) =>
                        checked ? [...current, task.id] : current.filter((id) => id !== task.id),
                      )
                    }
                  />
                )}
                label={`${task.title} (${task.estimateMinutes} min)`}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoundOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRound}>Create round</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!renameRoundId} onClose={() => setRenameRoundId(null)} fullWidth maxWidth="xs">
        <DialogTitle>Rename round</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Round name"
            fullWidth
            value={renameRoundTitle}
            onChange={(event) => setRenameRoundTitle(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameRoundId(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveRename} disabled={!renameRoundTitle.trim()}>
            Save name
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!roundPendingDelete} onClose={() => setRoundPendingDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete round?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{roundPendingDelete?.title}&quot;? Tasks in this round will move to
            Unassigned tasks for {selectedDayLabel}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoundPendingDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDeleteRound}>
            Delete round
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
