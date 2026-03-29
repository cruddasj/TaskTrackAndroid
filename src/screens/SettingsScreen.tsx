import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { Alert, Box, Button, Card, CardContent, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { playAlarmTone } from '../services/notifications';
import { useAppState } from '../state/AppStateContext';

export const SettingsScreen = () => {
  const {
    state,
    setUserName,
    addCategory,
    deleteCategory,
    setPomodoroMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    setSessionsBeforeLongBreak,
    setAlarmTone,
  } = useAppState();
  const [name, setName] = useState(state.userName);
  const [newCategory, setNewCategory] = useState('');
  const [pomodoroMinutes, setPomodoroMinutesInput] = useState(String(state.settings.pomodoroMinutes));
  const [shortBreakMinutes, setShortBreakMinutesInput] = useState(String(state.settings.shortBreakMinutes));
  const [longBreakMinutes, setLongBreakMinutesInput] = useState(String(state.settings.longBreakMinutes));
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreakInput] = useState(String(state.settings.sessionsBeforeLongBreak));

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
            <Typography variant="h5">Pomodoro timing</Typography>
            <TextField
              label="Recommended minutes per round"
              type="number"
              inputProps={{ min: 1 }}
              value={pomodoroMinutes}
              onChange={(event) => setPomodoroMinutesInput(event.target.value)}
              helperText="Default is 25 minutes."
            />
            <TextField
              label="Short break minutes"
              type="number"
              inputProps={{ min: 1 }}
              value={shortBreakMinutes}
              onChange={(event) => setShortBreakMinutesInput(event.target.value)}
              helperText="Break after each focus session."
            />
            <TextField
              label="Long break minutes"
              type="number"
              inputProps={{ min: 1 }}
              value={longBreakMinutes}
              onChange={(event) => setLongBreakMinutesInput(event.target.value)}
              helperText="Long reset break after several sessions."
            />
            <TextField
              label="Sessions before long break"
              type="number"
              inputProps={{ min: 2 }}
              value={sessionsBeforeLongBreak}
              onChange={(event) => setSessionsBeforeLongBreakInput(event.target.value)}
            />
            <TextField
              select
              label="Alarm tone"
              value={state.settings.alarmTone}
              onChange={(event) => setAlarmTone(event.target.value as 'bell' | 'chime' | 'digital')}
            >
              <MenuItem value="bell">Bell</MenuItem>
              <MenuItem value="chime">Chime</MenuItem>
              <MenuItem value="digital">Digital</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<VolumeUpRounded />}
              onClick={() => playAlarmTone(state.settings.alarmTone)}
            >
              Preview alarm tone
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const minutes = Number(pomodoroMinutes);
                const shortBreak = Number(shortBreakMinutes);
                const longBreak = Number(longBreakMinutes);
                const sessions = Number(sessionsBeforeLongBreak);
                if (!Number.isFinite(minutes) || !Number.isFinite(shortBreak) || !Number.isFinite(longBreak) || !Number.isFinite(sessions)) return;
                if (minutes <= 0 || shortBreak <= 0 || longBreak <= 0 || sessions <= 1) return;
                setPomodoroMinutes(minutes);
                setShortBreakMinutes(shortBreak);
                setLongBreakMinutes(longBreak);
                setSessionsBeforeLongBreak(sessions);
                setPomodoroMinutesInput(String(Math.round(minutes)));
                setShortBreakMinutesInput(String(Math.round(shortBreak)));
                setLongBreakMinutesInput(String(Math.round(longBreak)));
                setSessionsBeforeLongBreakInput(String(Math.round(sessions)));
              }}
              disabled={
                !pomodoroMinutes.trim() ||
                !shortBreakMinutes.trim() ||
                !longBreakMinutes.trim() ||
                !sessionsBeforeLongBreak.trim() ||
                Number(pomodoroMinutes) <= 0 ||
                Number(shortBreakMinutes) <= 0 ||
                Number(longBreakMinutes) <= 0 ||
                Number(sessionsBeforeLongBreak) <= 1
              }
            >
              Save timer settings
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
