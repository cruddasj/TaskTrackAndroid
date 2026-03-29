import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PlaylistAddRounded from '@mui/icons-material/PlaylistAddRounded';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { TaskBankItem, TaskPackTask } from '../types';

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

export const TaskBankScreen = () => {
  const navigate = useNavigate();
  const { state, addTaskFromBank, addTaskBankItem, updateTaskBankItem, deleteTaskBankItem, addTaskPack, deleteTaskPack } = useAppState();

  const [open, setOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [editingTaskBankId, setEditingTaskBankId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [packForm, setPackForm] = useState<PackFormState>(emptyPackForm);

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
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingTaskBankId(null);
    setForm(emptyForm);
  };

  const saveTask = () => {
    const title = form.title.trim();
    const description = form.description.trim() || 'Custom task';
    const category = form.category || state.categories[0] || 'Uncategorized';
    const estimateMinutes = Number(form.estimateMinutes);

    if (!title || !Number.isFinite(estimateMinutes) || estimateMinutes <= 0) return;

    if (editingTaskBankId) {
      updateTaskBankItem({
        id: editingTaskBankId,
        title,
        description,
        category,
        estimateMinutes,
      });
    } else {
      addTaskBankItem({ title, description, category, estimateMinutes });
    }

    closeDialog();
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

    addTaskPack({ name, cadence: packForm.cadence, tasks: normalizedTasks });
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
        <Typography variant="h3">Task Bank</Typography>
        <Typography color="text.secondary">A reusable reference list of tasks. Copy any task into Today&apos;s Tasks when needed.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="h5">Banked tasks</Typography>
              <Typography color="text.secondary">Manage your common tasks here. They are not directly assigned to rounds.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => navigate('/tasks-today')}>Open today&apos;s tasks</Button>
              <Button variant="outlined" onClick={openPackDialog}>New pack</Button>
              <Button variant="contained" onClick={openCreateBankDialog}>New bank task</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {state.taskBank.map((task) => (
              <Stack key={task.id} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography fontWeight={600}>{task.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{task.category} · {task.estimateMinutes} min</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => addTaskFromBank(task.id)} startIcon={<PlaylistAddRounded />}>Copy to today</Button>
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

      <Dialog open={open} onClose={closeDialog} fullWidth>
        <DialogTitle>{editingTaskBankId ? 'Edit task bank item' : 'Add task bank item'}</DialogTitle>
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

      <Dialog open={packOpen} onClose={closePackDialog} fullWidth maxWidth="md">
        <DialogTitle>Create task pack</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            <TextField label="Pack name" fullWidth value={packForm.name} onChange={(event) => setPackForm((current) => ({ ...current, name: event.target.value }))} />
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
