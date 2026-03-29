import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { Alert, Box, Button, Card, CardContent, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
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
    setAlarmRepeatCount,
    setShowFirstTimeGuidance,
    showSuccessMessage,
  } = useAppState();
  const [name, setName] = useState(state.userName);
  const [newCategory, setNewCategory] = useState('');
  const [pomodoroMinutes, setPomodoroMinutesInput] = useState(String(state.settings.pomodoroMinutes));
  const [shortBreakMinutes, setShortBreakMinutesInput] = useState(String(state.settings.shortBreakMinutes));
  const [longBreakMinutes, setLongBreakMinutesInput] = useState(String(state.settings.longBreakMinutes));
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreakInput] = useState(String(state.settings.sessionsBeforeLongBreak));
  const [alarmRepeatCount, setAlarmRepeatCountInput] = useState(String(state.settings.alarmRepeatCount));

  const needsName = !state.userName.trim();
  const categoryExists = useMemo(
    () => state.categories.some((category) => category.toLowerCase() === newCategory.trim().toLowerCase()),
    [newCategory, state.categories],
  );
  const guidanceAlertSx = { bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } };

  return (
    <Stack spacing={3} pb={2}>
      <Box>
        <Typography variant="h3">Settings</Typography>
        <Typography color="text.secondary">
          {needsName
            ? 'Welcome! Start by adding your name so the app can personalize your dashboard. Your data stays on this device.'
            : 'Update your profile, timer behavior, alarm settings, and task categories.'}
        </Typography>
      </Box>

      {needsName && state.settings.showFirstTimeGuidance && (
        <Alert
          icon={<InfoOutlined fontSize="inherit" />}
          severity="success"
          sx={guidanceAlertSx}
        >
          Finish this setup once, then revisit anytime to adjust your timer and alarm preferences.
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
              onClick={() => {
                setUserName(name.trim());
                showSuccessMessage('Name saved.');
              }}
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
            <FormControlLabel
              control={
                <Switch
                  checked={state.settings.showFirstTimeGuidance}
                  onChange={(_, checked) => {
                    setShowFirstTimeGuidance(checked);
                    showSuccessMessage(`First-time guidance ${checked ? 'enabled' : 'hidden'}.`);
                  }}
                />
              }
              label="Show first-time guidance across the app"
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Pomodoro timing</Typography>
            {state.settings.showFirstTimeGuidance ? (
              <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
                <Typography variant="body2" fontWeight={700} mb={0.5}>New to Pomodoro?</Typography>
                <Typography variant="body2">
                  The Pomodoro technique breaks work into short focus rounds followed by breaks. Start with a 25-minute
                  round, take a short break, and use a longer break after a few rounds.
                </Typography>
                <Typography variant="body2" mt={1}>
                  Adjust the values below to match your energy and workload. Your timer and alarm preferences apply to
                  all new rounds.
                </Typography>
              </Alert>
            ) : (
              <Typography color="text.secondary">First-time guidance is currently hidden.</Typography>
            )}
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
              onChange={(event) => {
                setAlarmTone(event.target.value as 'bell' | 'chime' | 'digital');
                showSuccessMessage('Alarm tone updated.');
              }}
            >
              <MenuItem value="bell">Bell</MenuItem>
              <MenuItem value="chime">Chime</MenuItem>
              <MenuItem value="digital">Digital</MenuItem>
            </TextField>
            <TextField
              label="Alarm repeats per session end"
              type="number"
              inputProps={{ min: 1, max: 10 }}
              value={alarmRepeatCount}
              onChange={(event) => setAlarmRepeatCountInput(event.target.value)}
              helperText="Choose how many times the alarm should ring (1 to 10)."
            />
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
                const repeats = Number(alarmRepeatCount);
                if (!Number.isFinite(minutes) || !Number.isFinite(shortBreak) || !Number.isFinite(longBreak) || !Number.isFinite(sessions) || !Number.isFinite(repeats)) return;
                if (minutes <= 0 || shortBreak <= 0 || longBreak <= 0 || sessions <= 1 || repeats < 1 || repeats > 10) return;
                setPomodoroMinutes(minutes);
                setShortBreakMinutes(shortBreak);
                setLongBreakMinutes(longBreak);
                setSessionsBeforeLongBreak(sessions);
                setAlarmRepeatCount(repeats);
                setPomodoroMinutesInput(String(Math.round(minutes)));
                setShortBreakMinutesInput(String(Math.round(shortBreak)));
                setLongBreakMinutesInput(String(Math.round(longBreak)));
                setSessionsBeforeLongBreakInput(String(Math.round(sessions)));
                setAlarmRepeatCountInput(String(Math.max(1, Math.min(10, Math.round(repeats)))));
                showSuccessMessage('Timer settings saved.');
              }}
              disabled={
                !pomodoroMinutes.trim() ||
                !shortBreakMinutes.trim() ||
                !longBreakMinutes.trim() ||
                !sessionsBeforeLongBreak.trim() ||
                !alarmRepeatCount.trim() ||
                Number(pomodoroMinutes) <= 0 ||
                Number(shortBreakMinutes) <= 0 ||
                Number(longBreakMinutes) <= 0 ||
                Number(sessionsBeforeLongBreak) <= 1 ||
                Number(alarmRepeatCount) < 1 ||
                Number(alarmRepeatCount) > 10
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
                  onClick={() => {
                    deleteCategory(category);
                    showSuccessMessage('Category deleted.');
                  }}
                  disabled={state.categories.length <= 1}
                >
                  <DeleteOutlineRounded color="error" />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                fullWidth
                label="New category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                error={!!newCategory.trim() && categoryExists}
                helperText={categoryExists ? 'Category already exists' : undefined}
              />
              <Button
                variant="outlined"
                sx={{ alignSelf: 'center' }}
                onClick={() => {
                  const category = newCategory.trim();
                  if (!category || categoryExists) return;
                  addCategory(category);
                  setNewCategory('');
                  showSuccessMessage('Category added.');
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
