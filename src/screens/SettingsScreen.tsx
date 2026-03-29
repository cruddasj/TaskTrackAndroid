import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Alert, Box, Button, Card, CardContent, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';

export const SettingsScreen = () => {
  const { state, setUserName, addCategory, deleteCategory, setPomodoroMinutes } = useAppState();
  const [name, setName] = useState(state.userName);
  const [newCategory, setNewCategory] = useState('');
  const [pomodoroMinutes, setPomodoroMinutesInput] = useState(String(state.settings.pomodoroMinutes));

  const needsName = !state.userName.trim();
  const categoryExists = useMemo(
    () => state.categories.some((category) => category.toLowerCase() === newCategory.trim().toLowerCase()),
    [newCategory, state.categories],
  );

  return (
    <Stack spacing={3} pb={2}>
      <Box>
        <Typography variant="h3">Settings</Typography>
        <Typography color="text.secondary">
          {needsName
            ? 'Welcome! Add your name for personalization. This data stays on your device and is never shared.'
            : 'Manage your profile and task categories.'}
        </Typography>
      </Box>

      {needsName && (
        <Alert
          icon={<InfoOutlined fontSize="inherit" />}
          severity="success"
          sx={{ bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } }}
        >
          This is your setup page. You can also manage your own task categories here any time.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Your name</Typography>
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus={needsName}
            />
            <Button
              variant="contained"
              onClick={() => setUserName(name.trim())}
              disabled={!name.trim()}
            >
              Save name
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Pomodoro duration</Typography>
            <TextField
              label="Recommended minutes per round"
              type="number"
              inputProps={{ min: 1 }}
              value={pomodoroMinutes}
              onChange={(event) => setPomodoroMinutesInput(event.target.value)}
              helperText="Default is 25 minutes."
            />
            <Button
              variant="contained"
              onClick={() => {
                const minutes = Number(pomodoroMinutes);
                if (!Number.isFinite(minutes) || minutes <= 0) return;
                setPomodoroMinutes(minutes);
                setPomodoroMinutesInput(String(Math.round(minutes)));
              }}
              disabled={!pomodoroMinutes.trim() || Number(pomodoroMinutes) <= 0}
            >
              Save pomodoro length
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Task categories</Typography>
            {state.categories.map((category) => (
              <Stack key={category} direction="row" alignItems="center" justifyContent="space-between">
                <Typography>{category}</Typography>
                <IconButton
                  aria-label={`delete-${category}`}
                  onClick={() => deleteCategory(category)}
                  disabled={state.categories.length <= 1}
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                label="New category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                error={!!newCategory.trim() && categoryExists}
                helperText={categoryExists ? 'Category already exists' : ' '}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  const category = newCategory.trim();
                  if (!category || categoryExists) return;
                  addCategory(category);
                  setNewCategory('');
                }}
                disabled={!newCategory.trim() || categoryExists}
              >
                Add
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};
