import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { playAlarmTone } from '../services/notifications';
import { useAppState } from '../state/AppStateContext';
import { createBackupJson, importBackupJson } from '../state/backup';
import { exportBackupFile } from '../services/backupExport';

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
    setSessionReviewGraceSeconds,
    setAlarmTone,
    setAlarmVolume,
    setAlarmRepeatCount,
    setShowFirstTimeGuidance,
    loadDemoData,
    importState,
    clearAllData,
    showSuccessMessage,
  } = useAppState();
  const [name, setName] = useState(state.userName);
  const [newCategory, setNewCategory] = useState('');
  const [pomodoroMinutes, setPomodoroMinutesInput] = useState(state.settings.pomodoroMinutes.toString());
  const [shortBreakMinutes, setShortBreakMinutesInput] = useState(state.settings.shortBreakMinutes.toString());
  const [longBreakMinutes, setLongBreakMinutesInput] = useState(state.settings.longBreakMinutes.toString());
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreakInput] = useState(state.settings.sessionsBeforeLongBreak.toString());
  const [sessionReviewGraceSeconds, setSessionReviewGraceSecondsInput] = useState(state.settings.sessionReviewGraceSeconds.toString());
  const [alarmVolume, setAlarmVolumeInput] = useState(state.settings.alarmVolume.toString());
  const [alarmRepeatCount, setAlarmRepeatCountInput] = useState(state.settings.alarmRepeatCount.toString());
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<string | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmDataClearOpen, setConfirmDataClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const needsName = !state.userName.trim();
  const categoryExists = useMemo(
    () => state.categories.some((category) => category.toLowerCase() === newCategory.trim().toLowerCase()),
    [newCategory, state.categories],
  );
  const guidanceAlertSx = { bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } };
  const hasBackupPassword = !!backupPassword.trim();

  const handleExportBackup = async () => {
    const backupJson = await createBackupJson(state, backupPassword);
    const fileName = `tasktrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const exportMethod = await exportBackupFile(backupJson, fileName);

    showSuccessMessage(
      exportMethod === 'filesystem'
        ? hasBackupPassword
          ? 'Encrypted backup saved to your Android files.'
          : 'Backup saved to your Android files.'
        : hasBackupPassword
          ? 'Encrypted backup exported.'
          : 'Backup exported.',
    );
  };

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    if (!file) return;

    setImportError(null);
    try {
      const content = await file.text();
      const importedState = await importBackupJson(content, backupPassword);
      importState(importedState);
      showSuccessMessage('Backup imported.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Backup import failed.');
    } finally {
      event.target.value = '';
    }
  };

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
            <Typography variant="h5">Backup and restore</Typography>
            {state.settings.showFirstTimeGuidance && (
              <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
                Save a backup copy of your app data. Add a password to lock the file so other people cannot read your task details.
              </Alert>
            )}
            <TextField
              label="Backup password (optional)"
              type="password"
              value={backupPassword}
              onChange={(event) => setBackupPassword(event.target.value)}
              helperText="Use this same password when importing encrypted backups."
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<DownloadRounded />}
                onClick={() => {
                  handleExportBackup().catch(() => {
                    setImportError('Backup export failed.');
                  });
                }}
              >
                Export data
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileRounded />}
                onClick={() => fileInputRef.current?.click()}
              >
                Import data
              </Button>
            </Stack>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                handleImportBackup(event).catch(() => {
                  setImportError('Backup import failed.');
                });
              }}
              hidden
            />
            {importError && (
              <Alert severity="error">{importError}</Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Demo data</Typography>
            {state.settings.showFirstTimeGuidance && (
              <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
                Load sample tasks, rounds, and recent completions to preview how your dashboard insights can look.
              </Alert>
            )}
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<DownloadRounded />}
              sx={{ width: { xs: '100%', sm: 'fit-content' }, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
              onClick={() => {
                loadDemoData();
                showSuccessMessage('Demo data loaded.');
              }}
            >
              Load demo data
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Clear app data</Typography>
            <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
              This permanently removes your tasks, rounds, timer state, and settings from this device.
            </Alert>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineRounded />}
              sx={{ width: { xs: '100%', sm: 'fit-content' }, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
              onClick={() => setConfirmDataClearOpen(true)}
            >
              Clear all app data
            </Button>
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
            ) : null}
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
              helperText="Break after each round."
            />
            <TextField
              label="Long break minutes"
              type="number"
              inputProps={{ min: 1 }}
              value={longBreakMinutes}
              onChange={(event) => setLongBreakMinutesInput(event.target.value)}
              helperText="Long reset break after several rounds."
            />
            <TextField
              label="Rounds before long break"
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
                setAlarmTone(event.target.value as 'bell' | 'chime' | 'digital' | 'gentle' | 'pulse');
                showSuccessMessage('Alarm tone updated.');
              }}
            >
              <MenuItem value="bell">Bell</MenuItem>
              <MenuItem value="chime">Chime</MenuItem>
              <MenuItem value="digital">Digital</MenuItem>
              <MenuItem value="gentle">Gentle</MenuItem>
              <MenuItem value="pulse">Pulse</MenuItem>
            </TextField>
            <TextField
              label="Alarm volume (%)"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={alarmVolume}
              onChange={(event) => setAlarmVolumeInput(event.target.value)}
              helperText="Controls in-app alarm loudness from 0 (mute) to 100 (max). Native notification volume still follows your device volume."
            />
            <TextField
              label="Alarm repeats when a round ends"
              type="number"
              inputProps={{ min: 1, max: 10 }}
              value={alarmRepeatCount}
              onChange={(event) => setAlarmRepeatCountInput(event.target.value)}
              helperText="Choose how many times the alarm should ring (1 to 10)."
            />
            <TextField
              label="Task confirmation timeout (seconds)"
              type="number"
              inputProps={{ min: 5, max: 600 }}
              value={sessionReviewGraceSeconds}
              onChange={(event) => setSessionReviewGraceSecondsInput(event.target.value)}
              helperText="If you do not confirm completed tasks in time, the app starts your break automatically."
            />
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<VolumeUpRounded />}
              onClick={() => playAlarmTone(state.settings.alarmTone, state.settings.alarmVolume / 100)}
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
                const reviewTimeout = Number(sessionReviewGraceSeconds);
                const volume = Number(alarmVolume);
                const repeats = Number(alarmRepeatCount);
                if (!Number.isFinite(minutes) || !Number.isFinite(shortBreak) || !Number.isFinite(longBreak) || !Number.isFinite(sessions) || !Number.isFinite(reviewTimeout) || !Number.isFinite(volume) || !Number.isFinite(repeats)) return;
                if (minutes <= 0 || shortBreak <= 0 || longBreak <= 0 || sessions <= 1 || reviewTimeout < 5 || reviewTimeout > 600 || volume < 0 || volume > 100 || repeats < 1 || repeats > 10) return;
                setPomodoroMinutes(minutes);
                setShortBreakMinutes(shortBreak);
                setLongBreakMinutes(longBreak);
                setSessionsBeforeLongBreak(sessions);
                setSessionReviewGraceSeconds(reviewTimeout);
                setAlarmVolume(volume);
                setAlarmRepeatCount(repeats);
                setPomodoroMinutesInput(String(Math.round(minutes)));
                setShortBreakMinutesInput(String(Math.round(shortBreak)));
                setLongBreakMinutesInput(String(Math.round(longBreak)));
                setSessionsBeforeLongBreakInput(String(Math.round(sessions)));
                setSessionReviewGraceSecondsInput(String(Math.max(5, Math.min(600, Math.round(reviewTimeout)))));
                setAlarmVolumeInput(String(Math.max(0, Math.min(100, Math.round(volume)))));
                setAlarmRepeatCountInput(String(Math.max(1, Math.min(10, Math.round(repeats)))));
                showSuccessMessage('Timer settings saved.');
              }}
              disabled={
                !pomodoroMinutes.trim() ||
                !shortBreakMinutes.trim() ||
                !longBreakMinutes.trim() ||
                !sessionsBeforeLongBreak.trim() ||
                !sessionReviewGraceSeconds.trim() ||
                !alarmVolume.trim() ||
                !alarmRepeatCount.trim() ||
                Number(pomodoroMinutes) <= 0 ||
                Number(shortBreakMinutes) <= 0 ||
                Number(longBreakMinutes) <= 0 ||
                Number(sessionsBeforeLongBreak) <= 1 ||
                Number(sessionReviewGraceSeconds) < 5 ||
                Number(sessionReviewGraceSeconds) > 600 ||
                Number(alarmVolume) < 0 ||
                Number(alarmVolume) > 100 ||
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
            {state.settings.showFirstTimeGuidance && (
              <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
                Use categories to group similar tasks (for example Work, Personal, or Errands) so planning, sorting, and review are easier throughout the app.
              </Alert>
            )}
            {state.categories.map((category) => (
              <Stack key={category} direction="row" alignItems="center" justifyContent="space-between">
                <Typography>{category}</Typography>
                <IconButton
                  aria-label={`delete-${category}`}
                  onClick={() => setCategoryPendingDelete(category)}
                  disabled={state.categories.length <= 1}
                >
                  <DeleteOutlineRounded color="error" />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={1} alignItems="stretch">
              <TextField
                fullWidth
                label="New category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                error={!!newCategory.trim() && categoryExists}
                helperText={categoryExists ? 'Category already exists' : undefined}
              />
              <Button
                variant="contained"
                sx={{ minHeight: 56 }}
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

      <Dialog open={!!categoryPendingDelete} onClose={() => setCategoryPendingDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete category?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete &quot;{categoryPendingDelete}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryPendingDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (!categoryPendingDelete) return;
              deleteCategory(categoryPendingDelete);
              showSuccessMessage('Category deleted.');
              setCategoryPendingDelete(null);
            }}
          >
            Delete category
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDataClearOpen} onClose={() => setConfirmDataClearOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Clear all app data?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This will delete all local tasks, rounds, history, and custom settings. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDataClearOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              clearAllData();
              setConfirmDataClearOpen(false);
              setName('');
              showSuccessMessage('All app data cleared.');
            }}
          >
            Clear data
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
