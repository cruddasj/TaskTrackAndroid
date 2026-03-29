import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PlaylistAddRounded from '@mui/icons-material/PlaylistAddRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { hasDuplicateTodayTaskTitle } from '../state/tasks';
import { TaskBankItem } from '../types';

interface TaskFormState {
  title: string;
  description: string;
  category: string;
  estimateMinutes: string;
  recurrenceDays: string;
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  category: '',
  estimateMinutes: '25',
  recurrenceDays: '',
};

export const TaskBankScreen = () => {
  const navigate = useNavigate();
  const { state, addTaskFromBank, addTaskBankItem, updateTaskBankItem, deleteTaskBankItem, showSuccessMessage } = useAppState();

  const [open, setOpen] = useState(false);
  const [editingTaskBankId, setEditingTaskBankId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const todayKey = new Date().toISOString().slice(0, 10);

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
      recurrenceDays: task.recurrenceDays ? String(task.recurrenceDays) : '',
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
    const recurrenceDays = Number(form.recurrenceDays);
    const normalizedRecurrenceDays =
      Number.isFinite(recurrenceDays) && recurrenceDays > 0 ? Math.round(recurrenceDays) : undefined;

    if (!title || !Number.isFinite(estimateMinutes) || estimateMinutes <= 0) return;

    if (editingTaskBankId) {
      updateTaskBankItem({
        id: editingTaskBankId,
        title,
        description,
        category,
        estimateMinutes,
        recurrenceDays: normalizedRecurrenceDays,
      });
      showSuccessMessage('Task Bank item updated.');
    } else {
      addTaskBankItem({ title, description, category, estimateMinutes, recurrenceDays: normalizedRecurrenceDays });
      showSuccessMessage('Task Bank item created.');
    }

    closeDialog();
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Task Bank</Typography>
        <Typography color="text.secondary">Create and manage your reusable task templates for quick reuse.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="h5">Task Bank guidance</Typography>
              <Typography color="text.secondary">Save common tasks here, then add only what is needed to Today&apos;s Tasks.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => navigate('/tasks-today')}>Open today&apos;s tasks</Button>
              <Button variant="contained" onClick={openCreateBankDialog}>New bank task</Button>
            </Stack>
          </Stack>
          <Alert
            icon={<InfoOutlined fontSize="inherit" />}
            severity="success"
            sx={{ mt: 2, bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } }}
          >
            Use clear task names, set an estimate, and add a repeat interval only for truly recurring tasks.
          </Alert>
          {validationMessage && <Alert severity="warning" sx={{ mt: 2 }}>{validationMessage}</Alert>}
        </CardContent>
      </Card>

      {state.taskBank.map((task) => (
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
                  onClick={() => {
                    deleteTaskBankItem(task.id);
                    showSuccessMessage('Task Bank item deleted.');
                  }}
                  aria-label={`delete-bank-${task.id}`}
                >
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
            <Typography color="text.secondary" mb={2}>{task.description}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip label={task.category} />
              <Chip label={`${task.estimateMinutes} min`} variant="outlined" />
              {task.recurrenceDays && <Chip label={`Every ${task.recurrenceDays} days`} variant="outlined" />}
              <Button
                size="small"
                onClick={() => {
                  if (hasDuplicateTodayTaskTitle(state.tasks, todayKey, task.title)) {
                    setValidationMessage(`"${task.title}" is already in Today's Tasks.`);
                    return;
                  }
                  addTaskFromBank(task.id);
                  setValidationMessage(null);
                  showSuccessMessage('Task added to today\'s tasks.');
                }}
                startIcon={<PlaylistAddRounded />}
              >
                Add to today&apos;s tasks
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {state.taskBank.length === 0 && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">No task bank items yet.</Typography>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveTask}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
