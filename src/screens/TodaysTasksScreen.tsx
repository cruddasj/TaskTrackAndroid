import AddRounded from '@mui/icons-material/AddRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { Task } from '../types';

interface TaskFormState {
  title: string;
  description: string;
  category: string;
  estimateMinutes: string;
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  category: '',
  estimateMinutes: '25',
};

export const TodaysTasksScreen = () => {
  const { state, addTask, updateTask, deleteTask, toggleTask, showSuccessMessage } = useAppState();
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysTasks = state.tasks.filter((task) => task.plannedDate === todayKey);
  const [open, setOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);

    useEffect(() => {
    if (!form.category && state.categories.length > 0) {
      setForm((current) => ({ ...current, category: state.categories[0] }));
    }
  }, [form.category, state.categories]);

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
  };

  const saveTask = () => {
    const title = form.title.trim();
    const description = form.description.trim() || 'Custom task';
    const category = form.category || state.categories[0] || 'Uncategorized';
    const estimateMinutes = Number(form.estimateMinutes);

    if (!title || !Number.isFinite(estimateMinutes) || estimateMinutes <= 0) return;

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
      showSuccessMessage('Today task updated.');
    } else {
      addTask({ title, description, category, estimateMinutes });
      showSuccessMessage('Today task created.');
    }

    closeDialog();
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Today&apos;s Tasks</Typography>
        <Typography color="text.secondary">Capture only what you plan to complete today, then assign tasks into rounds.</Typography>
      </Box>

      {todaysTasks.map((task) => (
        <Card key={task.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5">{task.title}</Typography>
                <IconButton size="small" onClick={() => openEditDialog(task)} aria-label={`edit-${task.id}`}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    deleteTask(task.id);
                    showSuccessMessage('Today task deleted.');
                  }}
                  aria-label={`delete-${task.id}`}
                >
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Stack>
              {task.status === 'done' ? <CheckCircleOutlineRounded color="primary" /> : <RadioButtonUncheckedRounded color="primary" />}
            </Stack>
            <Typography color="text.secondary" mb={2}>{task.description}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip label={task.category} />
              <Chip label={`${task.estimateMinutes} min`} variant="outlined" />
              {task.roundId && <Chip label="Assigned to round" color="secondary" variant="outlined" />}
              <Button
                size="small"
                onClick={() => {
                  toggleTask(task.id);
                  showSuccessMessage(task.status === 'done' ? 'Task marked as todo.' : 'Task marked as done.');
                }}
              >
                {task.status === 'done' ? 'Mark Todo' : 'Mark Done'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {todaysTasks.length === 0 && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">No tasks added for today yet. Create one or copy from Task Bank.</Typography>
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
        <DialogTitle>{editingTaskId ? 'Edit today task' : "Add today's task"}</DialogTitle>
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
          <TextField margin="dense" label="Category" fullWidth select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
            {state.categories.map((category) => (
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
    </Stack>
  );
};
