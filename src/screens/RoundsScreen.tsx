import CircleOutlined from '@mui/icons-material/CircleOutlined';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import ArrowDropDownRounded from '@mui/icons-material/ArrowDropDownRounded';
import ArrowDropUpRounded from '@mui/icons-material/ArrowDropUpRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
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
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { PlanningDay, PlanningDayToggle } from '../components/PlanningDayToggle';
import { useAppState } from '../state/AppStateContext';
import { Round } from '../types';
import {
  canDeleteRound,
  getCarryHistoryForRound,
  getRoundPlannedDate,
  getRoundEstimatedMinutes,
  getRoundTaskIdsForDisplay,
  hasEmptyRoundWithoutTasks,
  isRoundLockedByActivePomodoro,
  isRoundCompleted,
} from '../state/rounds';
import { getTodayKey, getTomorrowKey } from '../utils';
import { getRoundDisplaySections, getUnassignedTodoTasks, shouldShowCategoryGroupingSuggestion } from './roundsScreenVisibility';

export const RoundsScreen = () => {
  const { state, assignTasksToRound, autoGroupTasksForDate, moveRound, moveTaskInRound, createRound, deleteRound, showSuccessMessage } = useAppState();
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [createRoundOpen, setCreateRoundOpen] = useState(false);
  const [newRoundTaskIds, setNewRoundTaskIds] = useState<string[]>([]);
  const [roundPendingDelete, setRoundPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [roundCreationValidationMessage, setRoundCreationValidationMessage] = useState<string | null>(null);
  const todayKey = getTodayKey();
  const tomorrowKey = getTomorrowKey();
  const [planningDay, setPlanningDay] = useState<PlanningDay>('today');
  const selectedDateKey = planningDay === 'today' ? todayKey : tomorrowKey;
  const todaysTasks = useMemo(() => state.tasks.filter((task) => task.plannedDate === selectedDateKey), [state.tasks, selectedDateKey]);
  const orderedRounds = useMemo(() => state.rounds.filter((round) => getRoundPlannedDate(round) === selectedDateKey), [state.rounds, selectedDateKey]);

  const editingRound = useMemo(
    () => orderedRounds.find((round) => round.id === editingRoundId),
    [orderedRounds, editingRoundId],
  );
  const totalSelectedMinutes = useMemo(
    () =>
      selectedTaskIds.reduce((total, taskId) => {
        const task = todaysTasks.find((candidate) => candidate.id === taskId);
        return total + (task?.estimateMinutes ?? 0);
      }, 0),
    [selectedTaskIds, todaysTasks],
  );

  const openRoundAssignment = (roundId: string) => {
    const round = orderedRounds.find((item) => item.id === roundId);
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
    return todaysTasks.filter((task) => !task.roundId || task.roundId === editingRound?.id);
  }, [todaysTasks, editingRound]);
  const { plannedRounds, completedRounds } = useMemo(
    () => getRoundDisplaySections(orderedRounds),
    [orderedRounds],
  );
  const roundIds = useMemo(() => new Set(orderedRounds.map((round) => round.id)), [orderedRounds]);
  const unassignedTasks = useMemo(
    () => getUnassignedTodoTasks(todaysTasks, roundIds),
    [todaysTasks, roundIds],
  );
  const showCategoryGroupingSuggestion = useMemo(
    () => shouldShowCategoryGroupingSuggestion(todaysTasks),
    [todaysTasks],
  );
  const roundEstimatedMinutes = useMemo(
    () =>
      orderedRounds.reduce<Record<string, number>>((acc, round) => {
        acc[round.id] = getRoundEstimatedMinutes(round, todaysTasks);
        return acc;
      }, {}),
    [orderedRounds, todaysTasks],
  );
  const openCreateRoundDialog = () => {
    const hasEmptyRound = hasEmptyRoundWithoutTasks(orderedRounds);
    if (hasEmptyRound) {
      setRoundCreationValidationMessage(
        'You already have a round without tasks. Assign tasks to that round before creating another one.',
      );
      return;
    }

    setNewRoundTaskIds([]);
    setCreateRoundOpen(true);
    setRoundCreationValidationMessage(null);
    setEditingRoundId(null);
    setSelectedTaskIds([]);
  };
  const handleCreateRound = () => {
    createRound({ taskIds: newRoundTaskIds, plannedDate: selectedDateKey });
    setCreateRoundOpen(false);
    setNewRoundTaskIds([]);
    showSuccessMessage('New round created.');
  };

  const confirmDeleteRound = () => {
    if (!roundPendingDelete) return;
    deleteRound(roundPendingDelete.id);
    showSuccessMessage(`${roundPendingDelete.title} deleted. Tasks moved to Unassigned tasks for ${planningDay}.`);
    setRoundPendingDelete(null);
  };

  const handleQuickAssignToRound = (taskId: string, event: SelectChangeEvent<string>) => {
    const roundId = event.target.value;
    const targetRound = orderedRounds.find((round) => round.id === roundId);
    if (!targetRound || isRoundCompleted(targetRound)) return;
    const nextTaskIds = targetRound.taskIds.includes(taskId) ? targetRound.taskIds : [...targetRound.taskIds, taskId];
    assignTasksToRound(roundId, nextTaskIds);
    showSuccessMessage(`Assigned task to ${targetRound.title}.`);
  };

  const renderRoundCard = (round: Round) => {
    const isActivePomodoroRound = isRoundLockedByActivePomodoro(round.id, state.pomodoro.activeRoundId);
    const canDeleteSelectedRound = canDeleteRound(round, state.pomodoro.activeRoundId, state.settings.debugModeEnabled);
    const displayTaskIds = getRoundTaskIdsForDisplay(round, todaysTasks);
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
            {round.status === 'done' && (
              <Chip
                size="small"
                color="success"
                icon={<CheckCircleRounded />}
                label="Completed"
                aria-label={`completed-round-chip-${round.id}`}
              />
            )}
            <Stack direction="row" spacing={0.25}>
              {round.status !== 'done' && (
                <>
                  <IconButton size="small" onClick={() => moveRound(round.id, 'up')} aria-label={`move-round-up-${round.id}`}>
                    <ArrowDropUpRounded />
                  </IconButton>
                  <IconButton size="small" onClick={() => moveRound(round.id, 'down')} aria-label={`move-round-down-${round.id}`}>
                    <ArrowDropDownRounded />
                  </IconButton>
                </>
              )}
              {canDeleteSelectedRound && (
                <IconButton size="small" onClick={() => {
                  setRoundPendingDelete({ id: round.id, title: round.title });
                }} aria-label={`delete-round-${round.id}`}>
                  <DeleteOutlineRounded color="error" />
                </IconButton>
              )}
            </Stack>
          </Stack>
          <Stack spacing={1} mb={2}>
            {displayTaskIds.map((taskId) => {
              const task = todaysTasks.find((candidate) => candidate.id === taskId);
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
              const taskOrderIndex = round.taskIds.indexOf(task.id);
              return (
                <Stack direction="row" spacing={1} alignItems="center" key={task.id}>
                  {task.status === 'done' && !carriedMessage
                    ? <CheckCircleRounded fontSize="small" color="success" />
                    : <CircleOutlined fontSize="small" color="disabled" />}
                  <Typography sx={{ flex: 1 }}>
                    {task.title}
                    {carriedMessage ? ` ${carriedMessage}` : ''}
                  </Typography>
                  {round.status !== 'done' && task.roundId === round.id && (
                    <Stack direction="row" spacing={0.25}>
                      <IconButton
                        size="small"
                        aria-label={`move-task-up-${round.id}-${task.id}`}
                        onClick={() => moveTaskInRound(round.id, task.id, 'up')}
                        disabled={taskOrderIndex <= 0}
                      >
                        <ArrowDropUpRounded fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`move-task-down-${round.id}-${task.id}`}
                        onClick={() => moveTaskInRound(round.id, task.id, 'down')}
                        disabled={taskOrderIndex < 0 || taskOrderIndex >= round.taskIds.length - 1}
                      >
                        <ArrowDropDownRounded fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
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
            <Typography color="text.secondary">
              {state.settings.debugModeEnabled
                ? 'Completed round. Delete is available while debug mode is enabled.'
                : 'Completed round (read-only).'}
            </Typography>
          ) : (
            <Stack
              direction={isActivePomodoroRound ? 'column' : 'row'}
              alignItems="flex-start"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              mt={(roundEstimatedMinutes[round.id] ?? 0) > state.settings.pomodoroMinutes ? 1 : 0}
            >
              {isActivePomodoroRound && (
                <Typography color="warning.main" variant="body2">
                  Active timer round cannot be deleted here. Use the timer page to abandon it.
                </Typography>
              )}
              <Button variant="outlined" onClick={() => openRoundAssignment(round.id)}>
                {round.taskIds.length > 0 ? 'Edit tasks' : 'Assign tasks'}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Rounds</Typography>
        <Typography color="text.secondary">Plan and organize rounds for today or tomorrow.</Typography>
        <Box mt={1.25}>
          <PlanningDayToggle value={planningDay} onChange={setPlanningDay} />
        </Box>
      </Box>
      {roundCreationValidationMessage && <Alert severity="warning">{roundCreationValidationMessage}</Alert>}
      {planningDay === 'tomorrow' && <Alert severity="success">Tomorrow rounds are for planning only. Start rounds from today.</Alert>}
      {showCategoryGroupingSuggestion && (
        <Box>
          <Button
            variant="outlined"
            onClick={() => {
              autoGroupTasksForDate(selectedDateKey);
              showSuccessMessage(`Suggested rounds generated for ${planningDay}.`);
            }}
          >
            Suggest round groupings
          </Button>
        </Box>
      )}
      <Card sx={{ bgcolor: '#1a1a1a' }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Unassigned to-do tasks for {planningDay}</Typography>
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
                {todaysTasks.length === 0
                  ? `No tasks in ${planningDay}'s list yet.`
                  : `All ${planningDay}'s to-do tasks are assigned to a round.`}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
      {(planningDay === 'today' ? plannedRounds : orderedRounds).length > 0 && (
        <Typography variant="h6">
          {planningDay === 'today' ? `Planned (${plannedRounds.length})` : `Rounds (${orderedRounds.length})`}
        </Typography>
      )}
      {(planningDay === 'today' ? plannedRounds : orderedRounds).map((round) => renderRoundCard(round))}
      {planningDay === 'today' && completedRounds.length > 0 && (
        <>
          <Typography variant="h6" mt={1}>Completed ({completedRounds.length})</Typography>
          {completedRounds.map((round) => renderRoundCard(round))}
        </>
      )}
      <Dialog
        open={!!editingRound}
        onClose={() => setEditingRoundId(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign tasks to {editingRound?.title}</DialogTitle>
        <DialogContent>
          <Stack mt={0.5}>
            {todaysTasks.length === 0 && (
              <Typography color="text.secondary">No tasks in Today&apos;s Tasks yet. Add one from Task Bank first.</Typography>
            )}
            {availableTasks.length === 0 && todaysTasks.length > 0 && (
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
      <Dialog open={!!roundPendingDelete} onClose={() => setRoundPendingDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete round?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{roundPendingDelete?.title}&quot;? Tasks in this round will move to
            Unassigned tasks for {planningDay}.
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
