import AddRounded from '@mui/icons-material/AddRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useAppState } from '../state/AppStateContext';

export const TasksScreen = () => {
  const { state, addTask, toggleTask, startPomodoro } = useAppState();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Task Bank</Typography>
        <Typography color="text.secondary">Organize your home with focused routines.</Typography>
      </Box>
      {state.tasks.map((task) => (
        <Card key={task.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h5">{task.title}</Typography>
              {task.status === 'done' ? <CheckCircleOutlineRounded color="primary" /> : <BoltRounded color="primary" />}
            </Stack>
            <Typography color="text.secondary" mb={2}>{task.description}</Typography>
            <Stack direction="row" spacing={1}>
              <Chip label={task.category} />
              <Button size="small" variant="contained" onClick={() => startPomodoro(task.id, task.roundId, task.estimateMinutes)}>Start</Button>
              <Button size="small" onClick={() => toggleTask(task.id)}>{task.status === 'done' ? 'Mark Todo' : 'Mark Done'}</Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <IconButton
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', right: 24, bottom: 92, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } }}
      >
        <AddRounded />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Add task</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Task title"
            fullWidth
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!title.trim()) return;
              addTask({
                title,
                description: 'Custom task',
                category: 'Inbox',
                estimateMinutes: 25,
              });
              setTitle('');
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
