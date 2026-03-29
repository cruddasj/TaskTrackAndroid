import AddRounded from '@mui/icons-material/AddRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PlaylistAddRounded from '@mui/icons-material/PlaylistAddRounded';
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
import { useEffect, useMemo, useState } from 'react';
import { Task, TaskBankItem, TaskPackTask } from '../types';
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
  const {
    state,
    addTask,
    addTaskFromBank,
    updateTask,
    deleteTask,
    addTaskBankItem,
    updateTaskBankItem,
    deleteTaskBankItem,
    toggleTask,
    addTaskPack,
    deleteTaskPack,
  } = useAppState();
  const [open, setOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskBankId, setEditingTaskBankId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'today' | 'bank'>('today');
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [packForm, setPackForm] = useState<PackFormState>(emptyPackForm);

  const remainingTodayTasks = useMemo(
    () => state.tasks.filter((task) => task.status !== 'done').length,
    [state.tasks],
  );

  useEffect(() => {
    if (!form.category && state.categories.length > 0) {
      setForm((current) => ({ ...current, category: state.categories[0] }));
    }
  }, [form.category, state.categories]);

  const openCreateTodayDialog = () => {
    setFormMode('today');
    setEditingTaskId(null);
    setEditingTaskBankId(null);
    setForm({ ...emptyForm, category: state.categories[0] ?? '' });
    setOpen(true);
  };

  const openCreateBankDialog = () => {
    setFormMode('bank');
    setEditingTaskId(null);
    setEditingTaskBankId(null);
    setForm({ ...emptyForm, category: state.categories[0] ?? '' });
    setOpen(true);
  };

  const openEditTodayDialog = (task: Task) => {
    setFormMode('today');
    setEditingTaskId(task.id);
    setEditingTaskBankId(null);
    setForm({
      title: task.title,
      description: task.description,
      category: task.category,
      estimateMinutes: String(task.estimateMinutes),
    });
    setOpen(true);
  };

  const openEditBankDialog = (task: TaskBankItem) => {
    setFormMode('bank');
    setEditingTaskId(null);
    setEditingTaskBankId(task.id);
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
    setEditingTaskBankId(null);
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

    if (formMode === 'today') {
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
    } else if (editingTaskBankId) {
      updateTaskBankItem({
        id: editingTaskBankId,
        title,
        description,
        category,
        estimateMinutes,
      });
    } else {
      addTaskBankItem({
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
      addTaskBankItem({
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
        <Typography variant="h3">Tasks</Typography>
        <Typography color="text.secondary">Build your task bank, then pull what you need into today.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5">Today&apos;s tasks</Typography>
              <Typography color="text.secondary">{remainingTodayTasks} remaining · These are assignable to rounds.</Typography>
            </Box>
            <Button variant="contained" onClick={openCreateTodayDialog}>Add today task</Button>
          </Stack>
        </CardContent>
      </Card>

      {state.tasks.map((task) => (
        <Card key={task.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5">{task.title}</Typography>
                <IconButton size="small" onClick={() => openEditTodayDialog(task)} aria-label={`edit-${task.id}`}>
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
              {task.roundId && <Chip label="Assigned to round" color="secondary" variant="outlined" />}
              <Button size="small" onClick={() => toggleTask(task.id)}>{task.status === 'done' ? 'Mark Todo' : 'Mark Done'}</Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h5">Task bank</Typography>
                <Typography color="text.secondary">Reusable tasks you can add to today any time.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={openCreateBankDialog}>New bank task</Button>
                <Button variant="outlined" onClick={openPackDialog}>New pack</Button>
              </Stack>
            </Stack>
            {state.taskBank.map((task) => (
              <Stack key={task.id} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography fontWeight={600}>{task.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{task.category} · {task.estimateMinutes} min</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => addTaskFromBank(task.id)} startIcon={<PlaylistAddRounded />}>Add to today</Button>
                  <IconButton size="small" onClick={() => openEditBankDialog(task)} aria-label={`edit-bank-${task.id}`}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => deleteTaskBankItem(task.id)} aria-label={`delete-bank-${task.id}`}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
            {state.taskBank.length === 0 && <Typography color="text.secondary">No task bank items yet.</Typography>}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Task packs</Typography>
            <Typography color="text.secondary">Create reusable daily or weekly bundles of bank tasks.</Typography>
            {state.taskPacks.map((pack) => (
              <Stack key={pack.id} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography fontWeight={600}>{pack.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pack.cadence === 'daily' ? 'Daily' : 'Weekly'} · {pack.tasks.length} tasks
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => applyPack(pack.id)}>Add to bank</Button>
                  <IconButton size="small" onClick={() => deleteTaskPack(pack.id)} aria-label={`delete-pack-${pack.id}`}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <IconButton
        color="primary"
        onClick={openCreateTodayDialog}
        sx={{ position: 'fixed', right: 24, bottom: 92, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } }}
      >
        <AddRounded />
      </IconButton>

      <Dialog open={open} onClose={closeDialog} fullWidth>
        <DialogTitle>
          {editingTaskId || editingTaskBankId ? 'Edit task' : `Add ${formMode === 'today' ? "today's task" : 'task bank item'}`}
        </DialogTitle>
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
