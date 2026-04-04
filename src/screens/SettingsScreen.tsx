import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { ALARM_TONES, AlarmTone, getAlarmToneLabel } from '../constants/alarmTones';
import { playAlarmTone } from '../services/notifications';
import { useAppState } from '../state/AppStateContext';
import { createBackupJson, importBackupJson } from '../state/backup';
import { exportBackupFile } from '../services/backupExport';
import { getAlphabeticalCategories } from './settingsCategories';
import { getBackupExportSuccessMessage } from './settingsBackupMessages';

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
    setShowFirstTimeGuidance,
    setHasSeenWelcomeModal,
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
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<string | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmDataClearOpen, setConfirmDataClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const needsName = !state.userName.trim();
  const showWelcomeModal = needsName && !state.settings.hasSeenWelcomeModal;
  const categoryExists = useMemo(
    () => state.categories.some((category) => category.toLowerCase() === newCategory.trim().toLowerCase()),
    [newCategory, state.categories],
  );
  const guidanceAlertSx = { bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } };
  const hasBackupPassword = !!backupPassword.trim();
  const alphabeticalCategories = useMemo(() => getAlphabeticalCategories(state.categories), [state.categories]);

  const handleExportBackup = async () => {
    const backupJson = await createBackupJson(state, backupPassword);
    const fileName = `tasktrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const exportResult = await exportBackupFile(backupJson, fileName);
    showSuccessMessage(getBackupExportSuccessMessage(exportResult, hasBackupPassword));
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
            ? 'Welcome! Add your name to personalize your dashboard on this device. Your name is only used for local customization and is not shared.'
            : 'Update your profile, timer behavior, alarm settings, and task categories.'}
        </Typography>
      </Box>

      {needsName && state.settings.showFirstTimeGuidance && (
        <Alert
          icon={<InfoOutlined fontSize="inherit" />}
          severity="success"
          sx={guidanceAlertSx}
        >
          Complete these setup steps once, then come back anytime to adjust your timer and alarm preferences.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Your name</Typography>
            <Typography color="text.secondary" variant="body2">
              We store your name only on this device to personalize greetings and helpful messages. It is never shared.
            </Typography>
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
            <Typography variant="h5">Pomodoro timing</Typography>
            {state.settings.showFirstTimeGuidance ? (
              <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
                <Typography variant="body2" fontWeight={700} mb={0.5}>How Pomodoro works</Typography>
                <Typography variant="body2">
                  Work in one focused round, then take a short break. After a few rounds, take a longer break to reset.
                </Typography>
                <Typography variant="body2" mt={1}>
                  These are starting values. Change them anytime to fit your energy, schedule, and task difficulty.
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
                setAlarmTone(event.target.value as AlarmTone);
                showSuccessMessage('Alarm tone updated.');
              }}
            >
              {ALARM_TONES.map((tone) => (
                <MenuItem key={tone} value={tone}>{getAlarmToneLabel(tone)}</MenuItem>
              ))}
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
                if (!Number.isFinite(minutes) || !Number.isFinite(shortBreak) || !Number.isFinite(longBreak) || !Number.isFinite(sessions) || !Number.isFinite(reviewTimeout) || !Number.isFinite(volume)) return;
                if (minutes <= 0 || shortBreak <= 0 || longBreak <= 0 || sessions <= 1 || reviewTimeout < 5 || reviewTimeout > 600 || volume < 0 || volume > 100) return;
                setPomodoroMinutes(minutes);
                setShortBreakMinutes(shortBreak);
                setLongBreakMinutes(longBreak);
                setSessionsBeforeLongBreak(sessions);
                setSessionReviewGraceSeconds(reviewTimeout);
                setAlarmVolume(volume);
                setPomodoroMinutesInput(String(Math.round(minutes)));
                setShortBreakMinutesInput(String(Math.round(shortBreak)));
                setLongBreakMinutesInput(String(Math.round(longBreak)));
                setSessionsBeforeLongBreakInput(String(Math.round(sessions)));
                setSessionReviewGraceSecondsInput(String(Math.max(5, Math.min(600, Math.round(reviewTimeout)))));
                setAlarmVolumeInput(String(Math.max(0, Math.min(100, Math.round(volume)))));
                showSuccessMessage('Timer settings saved.');
              }}
              disabled={
                !pomodoroMinutes.trim() ||
                !shortBreakMinutes.trim() ||
                !longBreakMinutes.trim() ||
                !sessionsBeforeLongBreak.trim() ||
                !sessionReviewGraceSeconds.trim() ||
                !alarmVolume.trim() ||
                Number(pomodoroMinutes) <= 0 ||
                Number(shortBreakMinutes) <= 0 ||
                Number(longBreakMinutes) <= 0 ||
                Number(sessionsBeforeLongBreak) <= 1 ||
                Number(sessionReviewGraceSeconds) < 5 ||
                Number(sessionReviewGraceSeconds) > 600 ||
                Number(alarmVolume) < 0 ||
                Number(alarmVolume) > 100
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
                Categories keep your task list easy to scan. Start simple (for example Work, Personal, and Errands), then adjust as needed.
              </Alert>
            )}
            {alphabeticalCategories.map((category) => (
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
                Save a backup copy of your app data. Add a password if you want to protect the file before sharing or storing it.
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
                Load sample tasks and rounds to explore the app before adding your own data.
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


      <Dialog
        open={showWelcomeModal}
        onClose={() => setHasSeenWelcomeModal(true)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Welcome to TaskTrack</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <Typography color="text.secondary">
              TaskTrack helps you plan tasks, group them into rounds, and stay focused with a Pomodoro timer.
            </Typography>
            <Typography color="text.secondary">
              Pomodoro is simple: focus for one round, take a short break, and repeat. After a few rounds, take a longer break.
            </Typography>
            <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
              Start with the default timing, then change timer and alarm settings anytime to match your preference.
            </Alert>
            <Typography color="text.secondary">
              We only use your name on this device for personalization. Your data is not shared.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => setHasSeenWelcomeModal(true)}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

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
