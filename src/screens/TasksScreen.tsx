import AddRounded from '@mui/icons-material/AddRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Task } from '../types';
import { useAppState } from '../state/AppStateContext';

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

export const TasksScreen = () => {
  const { state, addTask, updateTask, deleteTask, toggleTask, startPomodoro } = useAppState();
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
    } else {
      addTask({
        title,
        description,
        category,
        estimateMinutes,
      });
    }

    closeDialog();
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Task Bank</Typography>
        <Typography color="text.secondary">Organize your work with focused routines.</Typography>
      </Box>
      {state.tasks.map((task) => (
        <Card key={task.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h5">{task.title}</Typography>
              {task.status === 'done' ? <CheckCircleOutlineRounded color="primary" /> : <BoltRounded color="primary" />}
            </Stack>
            <Typography color="text.secondary" mb={2}>{task.description}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip label={task.category} />
              <Chip label={`${task.estimateMinutes} min`} variant="outlined" />
              <Button size="small" variant="contained" onClick={() => startPomodoro(task.id, task.roundId, task.estimateMinutes)}>Start</Button>
              <Button size="small" onClick={() => toggleTask(task.id)}>{task.status === 'done' ? 'Mark Todo' : 'Mark Done'}</Button>
              <IconButton size="small" onClick={() => openEditDialog(task)} aria-label={`edit-${task.id}`}>
                <EditOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => deleteTask(task.id)} aria-label={`delete-${task.id}`}>
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <IconButton
        color="primary"
        onClick={openCreateDialog}
        sx={{ position: 'fixed', right: 24, bottom: 92, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } }}
      >
        <AddRounded />
      </IconButton>

      <Dialog open={open} onClose={closeDialog} fullWidth>
        <DialogTitle>{editingTaskId ? 'Edit task' : 'Add task'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Task title"
            fullWidth
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
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
          >
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
          <Button variant="contained" onClick={saveTask}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
