import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PlaylistAddRounded from '@mui/icons-material/PlaylistAddRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { PlanningDay, PlanningDayToggle } from '../components/PlanningDayToggle';
import { useAppState } from '../state/AppStateContext';
import { filterTaskBankItems, hasDuplicateTodayTaskTitle, sortCategoriesAlphabetically, sortTaskBankItemsAlphabetically, WEEKDAY_LABELS, WEEKDAY_SELECTION_ORDER } from '../state/tasks';
import { TaskBankItem } from '../types';
import { getTodayKey, getTomorrowKey, normalizeOptionalDescription } from '../utils';

interface TaskFormState {
  title: string;
  description: string;
  category: string;
  estimateMinutes: string;
  recurrenceMode: 'none' | 'days' | 'weekdays';
  recurrenceDays: string;
  recurrenceWeekdays: number[];
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  category: '',
  estimateMinutes: '25',
  recurrenceMode: 'none',
  recurrenceDays: '',
  recurrenceWeekdays: [],
};

export const TaskBankScreen = () => {
  const { state, addTaskFromBank, addTaskBankItem, updateTaskBankItem, deleteTaskBankItem, showSuccessMessage } = useAppState();

  const [open, setOpen] = useState(false);
  const [editingTaskBankId, setEditingTaskBankId] = useState<string | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<TaskBankItem | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const todayKey = getTodayKey();
  const tomorrowKey = getTomorrowKey();
  const [planningDay, setPlanningDay] = useState<PlanningDay>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | string>('all');
  const [selectedRecurrenceFilter, setSelectedRecurrenceFilter] = useState<'all' | 'one-off' | 'recurring'>('all');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const selectedDateKey = planningDay === 'today' ? todayKey : tomorrowKey;
  const sortedTaskBank = useMemo(() => sortTaskBankItemsAlphabetically(state.taskBank), [state.taskBank]);
  const sortedCategories = useMemo(() => sortCategoriesAlphabetically(state.categories), [state.categories]);
  const filteredTaskBank = useMemo(
    () => filterTaskBankItems(sortedTaskBank, { query: searchQuery, category: selectedCategoryFilter, recurrence: selectedRecurrenceFilter }),
    [searchQuery, selectedCategoryFilter, selectedRecurrenceFilter, sortedTaskBank],
  );

  useEffect(() => {
    if (!form.category && state.categories.length > 0) {
      setForm((current) => ({ ...current, category: state.categories[0] }));
    }
  }, [form.category, state.categories]);

  const openCreateBankDialog = () => {
    setEditingTaskBankId(null);
    setForm({ ...emptyForm, category: state.categories[0] ?? '' });
    setOpen(true);
  };

  const openEditBankDialog = (task: TaskBankItem) => {
    setEditingTaskBankId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      category: task.category,
      estimateMinutes: String(task.estimateMinutes),
      recurrenceMode: task.recurrenceWeekdays && task.recurrenceWeekdays.length > 0 ? 'weekdays' : task.recurrenceDays ? 'days' : 'none',
      recurrenceDays: task.recurrenceDays ? String(task.recurrenceDays) : '',
      recurrenceWeekdays: task.recurrenceWeekdays ?? [],
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingTaskBankId(null);
    setForm(emptyForm);
  };

  const confirmDeleteTaskBankItem = () => {
    if (!taskPendingDelete) return;
    deleteTaskBankItem(taskPendingDelete.id);
    showSuccessMessage('Task Bank item deleted.');
    setTaskPendingDelete(null);
  };

  const saveTask = () => {
    const title = form.title.trim();
    const description = normalizeOptionalDescription(form.description);
    const category = form.category || state.categories[0] || 'Uncategorized';
    const estimateMinutes = Number(form.estimateMinutes);
    const recurrenceDays = Number(form.recurrenceDays);
    const normalizedRecurrenceDays =
      form.recurrenceMode === 'days' && Number.isFinite(recurrenceDays) && recurrenceDays > 0 ? Math.round(recurrenceDays) : undefined;
    const normalizedRecurrenceWeekdays =
      form.recurrenceMode === 'weekdays'
        ? [...new Set(form.recurrenceWeekdays)].filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6).sort((a, b) => a - b)
        : undefined;

    if (!title || !Number.isFinite(estimateMinutes) || estimateMinutes <= 0) return;
    if (form.recurrenceMode === 'weekdays' && (!normalizedRecurrenceWeekdays || normalizedRecurrenceWeekdays.length === 0)) return;

    if (editingTaskBankId) {
      updateTaskBankItem({
        id: editingTaskBankId,
        title,
        description,
        category,
        estimateMinutes,
        recurrenceDays: normalizedRecurrenceDays,
        recurrenceWeekdays: normalizedRecurrenceWeekdays,
      });
      showSuccessMessage('Task Bank item updated.');
    } else {
      addTaskBankItem({
        title,
        description,
        category,
        estimateMinutes,
        recurrenceDays: normalizedRecurrenceDays,
        recurrenceWeekdays: normalizedRecurrenceWeekdays,
      });
      showSuccessMessage('Task Bank item created.');
    }

    closeDialog();
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Task Bank</Typography>
        <Typography color="text.secondary">Create reusable task templates, then add them to today or tomorrow in one tap.</Typography>
        <Box mt={1.25}>
          <PlanningDayToggle value={planningDay} onChange={setPlanningDay} />
        </Box>
      </Box>
      {state.settings.showFirstTimeGuidance && (
        <Card>
          <CardContent>
            <Box>
              <Typography variant="h5">Task Bank guidance</Typography>
              <Typography color="text.secondary">Save common tasks here, then add only what is needed to your selected planning day.</Typography>
            </Box>
            <Alert
              icon={<InfoOutlined fontSize="inherit" />}
              severity="success"
              sx={{ mt: 2, bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } }}
            >
              Use clear task names, set an estimate, and add a repeat interval only for truly recurring tasks.
            </Alert>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              onClick={() => setShowSearchFilters((current) => !current)}
              endIcon={<UnfoldMoreIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {showSearchFilters ? 'Hide search and filters' : 'Show search and filters'}
            </Button>
            <Collapse in={showSearchFilters}>
              <Stack spacing={1.5}>
                <TextField
                  label="Search Task Bank"
                  fullWidth
                  placeholder="Search by task name, description, or category"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label="Filter by category"
                    select
                    fullWidth
                    value={selectedCategoryFilter}
                    onChange={(event) => setSelectedCategoryFilter(event.target.value)}
                  >
                    <MenuItem value="all">All categories</MenuItem>
                    {sortedCategories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Filter by recurrence"
                    select
                    fullWidth
                    value={selectedRecurrenceFilter}
                    onChange={(event) => setSelectedRecurrenceFilter(event.target.value as 'all' | 'one-off' | 'recurring')}
                  >
                    <MenuItem value="all">All tasks</MenuItem>
                    <MenuItem value="one-off">One-off only</MenuItem>
                    <MenuItem value="recurring">Recurring only</MenuItem>
                  </TextField>
                </Stack>
              </Stack>
            </Collapse>
          </Stack>
        </CardContent>
      </Card>
      {filteredTaskBank.map((task) => (
        <Card key={task.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5">{task.title}</Typography>
                <IconButton size="small" onClick={() => openEditBankDialog(task)} aria-label={`edit-bank-${task.id}`}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ px: 0.5 }}
                  onClick={() => setTaskPendingDelete(task)}
                  aria-label={`delete-bank-${task.id}`}
                >
                  <DeleteOutlineRounded fontSize="small" color="error" />
                </IconButton>
              </Stack>
            </Stack>
            {task.description && <Typography color="text.secondary" mb={2}>{task.description}</Typography>}
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip label={task.category} />
                <Chip label={`${task.estimateMinutes} min`} variant="outlined" />
                {task.recurrenceDays && <Chip label={`Every ${task.recurrenceDays} days`} variant="outlined" />}
                {task.recurrenceWeekdays && task.recurrenceWeekdays.length > 0 && (
                  <Chip label={`On ${task.recurrenceWeekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join(', ')}`} variant="outlined" />
                )}
              </Stack>
              <Button
                size="small"
                sx={{ alignSelf: 'flex-start' }}
                onClick={() => {
                  if (hasDuplicateTodayTaskTitle(state.tasks, selectedDateKey, task.title)) {
                    showSuccessMessage(`"${task.title}" is already in ${planningDay}'s tasks.`);
                    return;
                  }
                  addTaskFromBank(task.id, selectedDateKey);
                  showSuccessMessage(`Task added to ${planningDay}'s tasks.`);
                }}
                startIcon={<PlaylistAddRounded />}
              >
                {`Add to ${planningDay}'s tasks`}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {state.taskBank.length === 0 && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">No Task Bank items yet.</Typography>
          </CardContent>
        </Card>
      )}
      {state.taskBank.length > 0 && filteredTaskBank.length === 0 && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">No Task Bank items match your current search or filters.</Typography>
          </CardContent>
        </Card>
      )}

      <IconButton
        color="primary"
        onClick={openCreateBankDialog}
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
        <DialogTitle>{editingTaskBankId ? 'Edit Task Bank item' : 'Add Task Bank item'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Task title" fullWidth value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
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
          <TextField
            margin="dense"
            label="Repeat pattern"
            fullWidth
            select
            value={form.recurrenceMode}
            onChange={(event) => setForm((current) => ({ ...current, recurrenceMode: event.target.value as TaskFormState['recurrenceMode'] }))}
          >
            <MenuItem value="none">No repeat</MenuItem>
            <MenuItem value="days">Every X days</MenuItem>
            <MenuItem value="weekdays">Specific days of the week</MenuItem>
          </TextField>
          {form.recurrenceMode === 'days' && (
            <TextField
              margin="dense"
              label="Repeat every (days)"
              fullWidth
              type="number"
              inputProps={{ min: 1 }}
              helperText="Optional. Leave blank for one-off templates."
              value={form.recurrenceDays}
              onChange={(event) => setForm((current) => ({ ...current, recurrenceDays: event.target.value }))}
            />
          )}
          {form.recurrenceMode === 'weekdays' && (
            <Stack mt={1}>
              <Typography variant="body2" color="text.secondary">Repeat on weekdays</Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap>
                {WEEKDAY_SELECTION_ORDER.map((weekday) => (
                  <FormControlLabel
                    key={WEEKDAY_LABELS[weekday]}
                    control={(
                      <Checkbox
                        checked={form.recurrenceWeekdays.includes(weekday)}
                        onChange={(_, checked) => setForm((current) => ({
                          ...current,
                          recurrenceWeekdays: checked
                            ? [...current.recurrenceWeekdays, weekday]
                            : current.recurrenceWeekdays.filter((item) => item !== weekday),
                        }))}
                      />
                    )}
                    label={WEEKDAY_LABELS[weekday].slice(0, 3)}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveTask}>Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!taskPendingDelete} onClose={() => setTaskPendingDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Task Bank item?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{taskPendingDelete?.title}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskPendingDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDeleteTaskBankItem}>
            Delete item
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
