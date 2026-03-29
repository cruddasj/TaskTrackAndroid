import AddRounded from '@mui/icons-material/AddRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
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
import { Task, TaskPackTask } from '../types';
import { useAppState } from '../state/AppStateContext';

interface TaskFormState {
  title: string;
  description: string;
  category: string;
  estimateMinutes: string;
}

interface PackFormState {
  name: string;
  cadence: 'daily' | 'weekly';
  tasks: TaskPackTask[];
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  category: '',
  estimateMinutes: '25',
};

const emptyPackForm: PackFormState = {
  name: '',
  cadence: 'daily',
  tasks: [
    {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      category: '',
      estimateMinutes: 25,
    },
  ],
};

export const TasksScreen = () => {
  const { state, addTask, updateTask, deleteTask, toggleTask, addTaskPack, deleteTaskPack } = useAppState();
  const [open, setOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [packForm, setPackForm] = useState<PackFormState>(emptyPackForm);

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

  const openPackDialog = () => {
    setPackForm({
      ...emptyPackForm,
      tasks: [
        {
          id: crypto.randomUUID(),
          title: '',
          description: '',
          category: state.categories[0] ?? '',
          estimateMinutes: 25,
        },
      ],
    });
    setPackOpen(true);
  };

  const closePackDialog = () => {
    setPackOpen(false);
    setPackForm(emptyPackForm);
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

  const savePack = () => {
    const name = packForm.name.trim();
    const normalizedTasks = packForm.tasks
      .map((task) => ({
        ...task,
        title: task.title.trim(),
        description: task.description.trim() || 'Custom task',
        category: task.category || state.categories[0] || 'Uncategorized',
      }))
      .filter((task) => task.title);

    if (!name || normalizedTasks.length === 0) return;

    addTaskPack({
      name,
      cadence: packForm.cadence,
      tasks: normalizedTasks,
    });
    closePackDialog();
  };

  const applyPack = (packId: string) => {
    const pack = state.taskPacks.find((item) => item.id === packId);
    if (!pack) return;

    pack.tasks.forEach((task) => {
      addTask({
        title: task.title,
        description: task.description,
        category: task.category,
        estimateMinutes: task.estimateMinutes,
      });
    });
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Task Bank</Typography>
        <Typography color="text.secondary">Organize your work with focused routines.</Typography>
      </Box>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h5">Task packs</Typography>
                <Typography color="text.secondary">Create reusable daily or weekly bundles of common tasks.</Typography>
              </Box>
              <Button variant="outlined" onClick={openPackDialog}>New pack</Button>
            </Stack>
            {state.taskPacks.map((pack) => (
              <Stack key={pack.id} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography fontWeight={600}>{pack.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pack.cadence === 'daily' ? 'Daily' : 'Weekly'} · {pack.tasks.length} tasks
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => applyPack(pack.id)}>Add tasks</Button>
                  <IconButton size="small" onClick={() => deleteTaskPack(pack.id)} aria-label={`delete-pack-${pack.id}`}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
      {state.tasks.map((task) => (
        <Card key={task.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5">{task.title}</Typography>
                <IconButton size="small" onClick={() => openEditDialog(task)} aria-label={`edit-${task.id}`}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => deleteTask(task.id)} aria-label={`delete-${task.id}`}>
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Stack>
              {task.status === 'done' ? (
                <CheckCircleOutlineRounded color="primary" />
              ) : (
                <RadioButtonUncheckedRounded color="primary" />
              )}
            </Stack>
            <Typography color="text.secondary" mb={2}>{task.description}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip label={task.category} />
              <Chip label={`${task.estimateMinutes} min`} variant="outlined" />
              <Button size="small" onClick={() => toggleTask(task.id)}>{task.status === 'done' ? 'Mark Todo' : 'Mark Done'}</Button>
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

      <Dialog open={packOpen} onClose={closePackDialog} fullWidth maxWidth="md">
        <DialogTitle>Create task pack</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            <TextField
              label="Pack name"
              fullWidth
              value={packForm.name}
              onChange={(event) => setPackForm((current) => ({ ...current, name: event.target.value }))}
            />
            <TextField
              label="Cadence"
              select
              value={packForm.cadence}
              onChange={(event) => setPackForm((current) => ({ ...current, cadence: event.target.value as 'daily' | 'weekly' }))}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </TextField>
            {packForm.tasks.map((packTask, index) => (
              <Card key={packTask.id} variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Task {index + 1}</Typography>
                    <TextField
                      label="Title"
                      fullWidth
                      value={packTask.title}
                      onChange={(event) =>
                        setPackForm((current) => ({
                          ...current,
                          tasks: current.tasks.map((task) =>
                            task.id === packTask.id ? { ...task, title: event.target.value } : task,
                          ),
                        }))
                      }
                    />
                    <TextField
                      label="Description"
                      fullWidth
                      value={packTask.description}
                      onChange={(event) =>
                        setPackForm((current) => ({
                          ...current,
                          tasks: current.tasks.map((task) =>
                            task.id === packTask.id ? { ...task, description: event.target.value } : task,
                          ),
                        }))
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label="Category"
                        select
                        fullWidth
                        value={packTask.category}
                        onChange={(event) =>
                          setPackForm((current) => ({
                            ...current,
                            tasks: current.tasks.map((task) =>
                              task.id === packTask.id ? { ...task, category: event.target.value } : task,
                            ),
                          }))
                        }
                      >
                        {state.categories.map((category) => (
                          <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Minutes"
                        type="number"
                        value={packTask.estimateMinutes}
                        onChange={(event) =>
                          setPackForm((current) => ({
                            ...current,
                            tasks: current.tasks.map((task) =>
                              task.id === packTask.id ? { ...task, estimateMinutes: Number(event.target.value) || 1 } : task,
                            ),
                          }))
                        }
                        inputProps={{ min: 1 }}
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="text"
              onClick={() =>
                setPackForm((current) => ({
                  ...current,
                  tasks: [
                    ...current.tasks,
                    {
                      id: crypto.randomUUID(),
                      title: '',
                      description: '',
                      category: state.categories[0] ?? '',
                      estimateMinutes: 25,
                    },
                  ],
                }))
              }
            >
              Add another task
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePackDialog}>Cancel</Button>
          <Button variant="contained" onClick={savePack}>Save pack</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
