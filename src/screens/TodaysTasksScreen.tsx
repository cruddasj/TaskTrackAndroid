import AddRounded from '@mui/icons-material/AddRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CircleOutlined from '@mui/icons-material/CircleOutlined';
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDefaultSelectedRecurringSuggestionIds, getSelectedRecurringSuggestions } from './todaysTaskSuggestions';
import { getTaskPrimaryActionLabel } from './todaysTasksActions';
import { getPlanningDayFromQuery } from './planningDayQuery';
import { PlanningDay, PlanningDayToggle } from '../components/PlanningDayToggle';
import { useAppState } from '../state/AppStateContext';
import { hasDuplicateTodayTaskTitle, sortCategoriesAlphabetically, sortTasksAlphabetically, suggestRecurringTaskBankItems, WEEKDAY_LABELS } from '../state/tasks';
import { Task, TaskBankItem } from '../types';
import { getTodayKey, getTomorrowKey, normalizeOptionalDescription } from '../utils';

interface TaskFormState {
  title: string;
  description: string;
  category: string;
  estimateMinutes: string;
}

interface TaskPrimaryAction {
  label: string;
  onClick: () => void;
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  category: '',
  estimateMinutes: '25',
};

export const TodaysTasksScreen = () => {
  const { state, addTask, updateTask, deleteTask, toggleTask, showSuccessMessage } = useAppState();
  const [searchParams] = useSearchParams();
  const todayKey = getTodayKey();
  const tomorrowKey = getTomorrowKey();
  const [planningDay, setPlanningDay] = useState<PlanningDay>(() => getPlanningDayFromQuery(searchParams.get('day')));
  const selectedDateKey = planningDay === 'today' ? todayKey : tomorrowKey;
  const tasksForSelectedDay = useMemo(
    () => sortTasksAlphabetically(state.tasks.filter((task) => task.plannedDate === selectedDateKey)),
    [selectedDateKey, state.tasks],
  );
  const [open, setOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [recurringSuggestions, setRecurringSuggestions] = useState<TaskBankItem[]>([]);
  const [selectedRecurringSuggestionIds, setSelectedRecurringSuggestionIds] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const taskActionButtonSx = { p: 0.625 };
  const taskActionRowSx = { flexShrink: 0, alignSelf: 'flex-start' } as const;
  const sortedCategories = useMemo(() => sortCategoriesAlphabetically(state.categories), [state.categories]);

  const formatRecurrenceLabel = (task: TaskBankItem): string => {
    if (task.recurrenceWeekdays && task.recurrenceWeekdays.length > 0) {
      return `on ${task.recurrenceWeekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join(', ')}`;
    }
    if (task.recurrenceDayOfMonth) return `on day ${task.recurrenceDayOfMonth} of each month`;
    if (task.recurrenceDays) return `every ${task.recurrenceDays} days`;
    return 'manual';
  };

  useEffect(() => {
    if (!form.category && state.categories.length > 0) {
      setForm((current) => ({ ...current, category: state.categories[0] }));
    }
  }, [form.category, state.categories]);

  useEffect(() => {
    setPlanningDay(getPlanningDayFromQuery(searchParams.get('day')));
  }, [searchParams]);

  const openCreateDialog = () => {
    setEditingTaskId(null);
    setForm({ ...emptyForm, category: state.categories[0] ?? '' });
    setOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      category: task.category,
      estimateMinutes: String(task.estimateMinutes),
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingTaskId(null);
    setForm(emptyForm);
    setValidationMessage(null);
  };

  const saveTask = () => {
    const title = form.title.trim();
    const description = normalizeOptionalDescription(form.description);
    const category = form.category || state.categories[0] || 'Uncategorized';
    const estimateMinutes = Number(form.estimateMinutes);

    if (!title || !Number.isFinite(estimateMinutes) || estimateMinutes <= 0) return;
    if (hasDuplicateTodayTaskTitle(state.tasks, selectedDateKey, title, editingTaskId ?? undefined)) {
      setValidationMessage(`A task with this name already exists in ${planningDay === 'today' ? 'today' : 'tomorrow'}'s list.`);
      return;
    }

    if (editingTaskId) {
      const existingTask = state.tasks.find((task) => task.id === editingTaskId);
      if (!existingTask) return;
      updateTask({
        ...existingTask,
        title,
        description,
        category,
        estimateMinutes,
      });
      showSuccessMessage(`${planningDay === 'today' ? 'Today' : 'Tomorrow'} task updated.`);
    } else {
      addTask({ title, description, category, estimateMinutes, plannedDate: selectedDateKey });
      showSuccessMessage(`${planningDay === 'today' ? 'Today' : 'Tomorrow'} task created.`);
    }

    setValidationMessage(null);
    closeDialog();
  };

  const openRecurringSuggestions = () => {
    const suggestions = suggestRecurringTaskBankItems(state.taskBank, state.tasks, selectedDateKey);
    setRecurringSuggestions(suggestions);
    setSelectedRecurringSuggestionIds(getDefaultSelectedRecurringSuggestionIds(suggestions));
    setSuggestionsOpen(true);
  };

  const toggleRecurringSuggestion = (taskId: string) => {
    setSelectedRecurringSuggestionIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);
  };

  const addRecurringSuggestions = () => {
    const selectedSuggestions = getSelectedRecurringSuggestions(recurringSuggestions, selectedRecurringSuggestionIds);
    selectedSuggestions.forEach((item) =>
      addTask({
        title: item.title,
        description: item.description,
        category: item.category,
        estimateMinutes: item.estimateMinutes,
        plannedDate: selectedDateKey,
      }));
    if (selectedSuggestions.length > 0) {
      showSuccessMessage(`${selectedSuggestions.length} recurring task suggestion${selectedSuggestions.length === 1 ? '' : 's'} added.`);
    }
    setSuggestionsOpen(false);
  };

  const requestDeleteTask = (task: Task) => {
    setTaskPendingDelete(task);
  };

  const cancelDeleteTask = () => {
    setTaskPendingDelete(null);
  };

  const confirmDeleteTask = () => {
    if (!taskPendingDelete) return;
    deleteTask(taskPendingDelete.id);
    showSuccessMessage(`${planningDay === 'today' ? 'Today' : 'Tomorrow'} task deleted.`);
    setTaskPendingDelete(null);
  };

  const getTaskPrimaryAction = (task: Task): TaskPrimaryAction => {
    if (planningDay === 'tomorrow') {
      return {
        label: getTaskPrimaryActionLabel(planningDay, task.status),
        onClick: () => {
          updateTask({ ...task, plannedDate: todayKey });
          showSuccessMessage('Task moved to today.');
        },
      };
    }

    return {
      label: getTaskPrimaryActionLabel(planningDay, task.status),
      onClick: () => {
        toggleTask(task.id);
        showSuccessMessage(task.status === 'done' ? 'Task marked as to-do.' : 'Task marked as done.');
      },
    };
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Tasks</Typography>
        <Typography color="text.secondary">Plan tasks for today or tomorrow, then assign today&apos;s tasks into rounds.</Typography>
        <Box mt={1.25}>
          <PlanningDayToggle value={planningDay} onChange={setPlanningDay} />
        </Box>
      </Box>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="h5">Recurring task suggestions</Typography>
              <Typography color="text.secondary">Review templates from Task Bank that are due based on your repeat settings before adding them.</Typography>
            </Box>
            <Button variant="outlined" onClick={openRecurringSuggestions}>Suggest recurring tasks</Button>
          </Stack>
        </CardContent>
      </Card>

      {tasksForSelectedDay.map((task) => {
        const primaryAction = getTaskPrimaryAction(task);
        return (
          <Card key={task.id}>
            <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1} spacing={1.5}>
              <Typography variant="h5">{task.title}</Typography>
              <Stack direction="row" spacing={0.5} sx={taskActionRowSx}>
                <IconButton size="small" onClick={() => openEditDialog(task)} aria-label={`edit-${task.id}`} sx={taskActionButtonSx}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => requestDeleteTask(task)}
                  aria-label={`delete-${task.id}`}
                  sx={taskActionButtonSx}
                >
                  <DeleteOutlineRounded sx={{ fontSize: 18 }} color="error" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    toggleTask(task.id);
                    showSuccessMessage(task.status === 'done' ? 'Task marked as to-do.' : 'Task marked as done.');
                  }}
                  aria-label={`toggle-${task.id}`}
                  sx={taskActionButtonSx}
                >
                  {task.status === 'done' ? <CheckCircleRounded color="success" /> : <CircleOutlined color="disabled" />}
                </IconButton>
              </Stack>
            </Stack>
            {task.description && <Typography color="text.secondary" mb={2}>{task.description}</Typography>}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip label={task.category} />
              <Chip label={`${task.estimateMinutes} min`} variant="outlined" />
              {task.roundId && <Chip label="Assigned to round" color="secondary" variant="outlined" />}
            </Stack>
            <Button
              size="small"
              sx={{ mt: 1.25, alignSelf: 'flex-start' }}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
            </CardContent>
          </Card>
        );
      })}

      {tasksForSelectedDay.length === 0 && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">No tasks added for {planningDay} yet. Create one or copy from Task Bank.</Typography>
          </CardContent>
        </Card>
      )}

      <IconButton
        color="primary"
        onClick={openCreateDialog}
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
      >
        <AddRounded />
      </IconButton>

      <Dialog open={open} onClose={closeDialog} fullWidth>
        <DialogTitle>{editingTaskId ? `Edit ${planningDay}'s task` : `Add ${planningDay}'s task`}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Task title"
            fullWidth
            value={form.title}
            error={!!validationMessage}
            helperText={validationMessage ?? ' '}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setForm((current) => ({ ...current, title: nextTitle }));
              if (!validationMessage) return;
              if (!hasDuplicateTodayTaskTitle(state.tasks, selectedDateKey, nextTitle, editingTaskId ?? undefined)) {
                setValidationMessage(null);
              }
            }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    maxHeight: 'min(50vh, 320px)',
                    mb: 'env(safe-area-inset-bottom, 0px)',
                  },
                },
                MenuListProps: {
                  sx: {
                    pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
                  },
                },
              },
            }}
          >
            {sortedCategories.map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Estimated minutes"
            fullWidth
            type="number"
            inputProps={{ min: 1 }}
            value={form.estimateMinutes}
            onChange={(event) => setForm((current) => ({ ...current, estimateMinutes: event.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveTask}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!taskPendingDelete} onClose={cancelDeleteTask} fullWidth>
        <DialogTitle>Delete task?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete &quot;{taskPendingDelete?.title}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteTask}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDeleteTask}>
            Delete task
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            maxHeight: 'min(92dvh, 760px)',
          },
        }}
      >
        <DialogTitle>Suggested recurring tasks</DialogTitle>
        <DialogContent
          sx={{
            overflowY: 'auto',
            pb: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          {recurringSuggestions.length === 0 ? (
            <Alert severity="success" sx={{ bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } }}>
              No suggestions are due now. Suggestions only appear when today matches a task&apos;s repeat weekdays or day interval from Task Bank.
            </Alert>
          ) : (
            <Stack spacing={1.5} mt={0.5}>
              <Typography color="text.secondary">Due suggestions are preselected by default. Tap “Add suggested tasks” to create Today&apos;s Tasks for the checked items.</Typography>
              {recurringSuggestions.map((task) => (
                <Stack key={task.id} direction="row" alignItems="flex-start" spacing={1}>
                  <Checkbox
                    checked={selectedRecurringSuggestionIds.includes(task.id)}
                    onChange={() => toggleRecurringSuggestion(task.id)}
                    inputProps={{ 'aria-label': `select-recurring-task-${task.id}` }}
                    sx={{ mt: -0.5 }}
                  />
                  <Box>
                    <Typography fontWeight={700}>{task.title}</Typography>
                    <Typography color="text.secondary" variant="body2">{task.description}</Typography>
                    <Typography color="text.secondary" variant="body2">{task.category} ({task.estimateMinutes} min - {formatRecurrenceLabel(task)})</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 'max(8px, env(safe-area-inset-bottom))' }}>
          <Button onClick={() => setSuggestionsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addRecurringSuggestions} disabled={recurringSuggestions.length === 0 || selectedRecurringSuggestionIds.length === 0}>
            Add suggested tasks
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
