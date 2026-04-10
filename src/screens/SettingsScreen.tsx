import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Filter1 from '@mui/icons-material/Filter1';
import Filter2 from '@mui/icons-material/Filter2';
import Filter3 from '@mui/icons-material/Filter3';
import Filter4 from '@mui/icons-material/Filter4';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormHelperText, IconButton, MenuItem, Slider, Stack, Switch, TextField, Typography } from '@mui/material';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ALARM_TONES, AlarmTone, getAlarmToneLabel } from '../constants/alarmTones';
import { playAlarmTone } from '../services/notifications';
import { isBatteryOptimizationEnabled, openBatteryOptimizationSettings } from '../services/batteryOptimization';
import { useAppState } from '../state/AppStateContext';
import { createBackupJson, importBackupJson } from '../state/backup';
import { exportBackupFile } from '../services/backupExport';
import { AppState } from '../types';
import { getAlphabeticalCategories } from './settingsCategories';
import { getBackupExportSuccessMessage } from './settingsBackupMessages';
import { getFirstTimeWorkflowSteps } from './settingsWelcome';

export const SettingsScreen = () => {
  const {
    state,
    setUserName,
    addCategory,
    deleteCategory,
    setPomodoroMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    setDebugModeEnabled,
    setDebugPomodoroSeconds,
    setDebugShortBreakSeconds,
    setDebugLongBreakSeconds,
    setSessionsBeforeLongBreak,
    setSessionReviewGraceSeconds,
    setAlarmTone,
    setAlarmVolume,
    setRecurringSuggestionCooldownEnabled,
    setRecurringSuggestionCooldownDays,
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
  const [debugPomodoroSeconds, setDebugPomodoroSecondsInput] = useState(state.settings.debugPomodoroSeconds.toString());
  const [debugShortBreakSeconds, setDebugShortBreakSecondsInput] = useState(state.settings.debugShortBreakSeconds.toString());
  const [debugLongBreakSeconds, setDebugLongBreakSecondsInput] = useState(state.settings.debugLongBreakSeconds.toString());
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreakInput] = useState(state.settings.sessionsBeforeLongBreak.toString());
  const [sessionReviewGraceSeconds, setSessionReviewGraceSecondsInput] = useState(state.settings.sessionReviewGraceSeconds.toString());
  const [alarmVolume, setAlarmVolumeInput] = useState(state.settings.alarmVolume.toString());
  const [recurringSuggestionCooldownDays, setRecurringSuggestionCooldownDaysInput] =
    useState(state.settings.recurringSuggestionCooldownDays.toString());
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<string | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmDataClearOpen, setConfirmDataClearOpen] = useState(false);
  const [batteryOptimizationEnabled, setBatteryOptimizationEnabled] = useState<boolean | null>(null);
  const [batteryOptimizationLoading, setBatteryOptimizationLoading] = useState(false);
  const [batteryOptimizationError, setBatteryOptimizationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const needsName = !state.userName.trim();
  const showWelcomeModal = !!state.userName.trim() && !state.settings.hasSeenWelcomeModal;
  const categoryExists = useMemo(
    () => state.categories.some((category) => category.toLowerCase() === newCategory.trim().toLowerCase()),
    [newCategory, state.categories],
  );
  const guidanceAlertSx = { bgcolor: 'rgba(145,247,142,0.12)', color: 'primary.main', '& .MuiAlert-icon': { color: 'primary.main' } };
  const hasBackupPassword = !!backupPassword.trim();
  const alphabeticalCategories = useMemo(() => getAlphabeticalCategories(state.categories), [state.categories]);
  const showBatteryOptimizationSettingsCard = batteryOptimizationEnabled !== null;
  const firstTimeWorkflowSteps = getFirstTimeWorkflowSteps();
  const welcomeStepIcons = [Filter1, Filter2, Filter3, Filter4];

  useEffect(() => {
    let isMounted = true;
    setBatteryOptimizationLoading(true);
    isBatteryOptimizationEnabled()
      .then((enabled) => {
        if (!isMounted) return;
        setBatteryOptimizationEnabled(enabled);
        setBatteryOptimizationError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setBatteryOptimizationError('Could not check Android battery optimization status.');
      })
      .finally(() => {
        if (!isMounted) return;
        setBatteryOptimizationLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toRoundedNumber = (value: string): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.round(parsed);
  };

  const getExportStateWithTimerDrafts = (): AppState => {
    const minutes = toRoundedNumber(pomodoroMinutes);
    const shortBreak = toRoundedNumber(shortBreakMinutes);
    const longBreak = toRoundedNumber(longBreakMinutes);
    const roundSeconds = toRoundedNumber(debugPomodoroSeconds);
    const shortBreakSeconds = toRoundedNumber(debugShortBreakSeconds);
    const longBreakSeconds = toRoundedNumber(debugLongBreakSeconds);
    const sessions = toRoundedNumber(sessionsBeforeLongBreak);
    const reviewTimeout = toRoundedNumber(sessionReviewGraceSeconds);
    const volume = toRoundedNumber(alarmVolume);
    const cooldownDays = toRoundedNumber(recurringSuggestionCooldownDays);

    return {
      ...state,
      settings: {
        ...state.settings,
        pomodoroMinutes: minutes && minutes > 0 ? minutes : state.settings.pomodoroMinutes,
        shortBreakMinutes: shortBreak && shortBreak > 0 ? shortBreak : state.settings.shortBreakMinutes,
        longBreakMinutes: longBreak && longBreak > 0 ? longBreak : state.settings.longBreakMinutes,
        debugPomodoroSeconds: roundSeconds && roundSeconds > 0 ? roundSeconds : state.settings.debugPomodoroSeconds,
        debugShortBreakSeconds: shortBreakSeconds && shortBreakSeconds > 0 ? shortBreakSeconds : state.settings.debugShortBreakSeconds,
        debugLongBreakSeconds: longBreakSeconds && longBreakSeconds > 0 ? longBreakSeconds : state.settings.debugLongBreakSeconds,
        sessionsBeforeLongBreak: sessions && sessions > 1 ? sessions : state.settings.sessionsBeforeLongBreak,
        sessionReviewGraceSeconds:
          reviewTimeout && reviewTimeout >= 5 && reviewTimeout <= 600
            ? reviewTimeout
            : state.settings.sessionReviewGraceSeconds,
        alarmVolume:
          volume !== null && volume >= 0 && volume <= 100
            ? volume
            : state.settings.alarmVolume,
        recurringSuggestionCooldownDays:
          cooldownDays && cooldownDays > 0
            ? cooldownDays
            : state.settings.recurringSuggestionCooldownDays,
      },
    };
  };

  const handleExportBackup = async () => {
    const backupState = getExportStateWithTimerDrafts();
    const backupJson = await createBackupJson(backupState, backupPassword);
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
              label={state.settings.debugModeEnabled ? 'Round duration (seconds)' : 'Recommended minutes per round'}
              type="number"
              inputProps={{ min: 1 }}
              value={state.settings.debugModeEnabled ? debugPomodoroSeconds : pomodoroMinutes}
              onChange={(event) =>
                state.settings.debugModeEnabled
                  ? setDebugPomodoroSecondsInput(event.target.value)
                  : setPomodoroMinutesInput(event.target.value)
              }
              helperText={state.settings.debugModeEnabled ? 'Use short durations for timer debugging.' : 'Default is 25 minutes.'}
            />
            <TextField
              label={state.settings.debugModeEnabled ? 'Short break (seconds)' : 'Short break minutes'}
              type="number"
              inputProps={{ min: 1 }}
              value={state.settings.debugModeEnabled ? debugShortBreakSeconds : shortBreakMinutes}
              onChange={(event) =>
                state.settings.debugModeEnabled
                  ? setDebugShortBreakSecondsInput(event.target.value)
                  : setShortBreakMinutesInput(event.target.value)
              }
              helperText={state.settings.debugModeEnabled ? 'Break after each round (debug seconds).' : 'Break after each round.'}
            />
            <TextField
              label={state.settings.debugModeEnabled ? 'Long break (seconds)' : 'Long break minutes'}
              type="number"
              inputProps={{ min: 1 }}
              value={state.settings.debugModeEnabled ? debugLongBreakSeconds : longBreakMinutes}
              onChange={(event) =>
                state.settings.debugModeEnabled
                  ? setDebugLongBreakSecondsInput(event.target.value)
                  : setLongBreakMinutesInput(event.target.value)
              }
              helperText={state.settings.debugModeEnabled ? 'Long reset break in debug seconds.' : 'Long reset break after several rounds.'}
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
            <FormControl
              fullWidth
              sx={{
                maxWidth: '99%',
                px: 0.5,
                boxSizing: 'border-box',
              }}
            >
              <Typography gutterBottom id="alarm-volume-slider-label" variant="body2">
                Alarm volume ({alarmVolume}%)
              </Typography>
              <Slider
                aria-labelledby="alarm-volume-slider-label"
                value={Number.isFinite(Number(alarmVolume)) ? Number(alarmVolume) : 0}
                onChange={(_, value) => setAlarmVolumeInput(String(value))}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
              />
              <FormHelperText>
                Controls in-app alarm loudness from 0 (mute) to 100 (max). Native notification volume still follows your device volume.
              </FormHelperText>
            </FormControl>
            <TextField
              label="Confirmation inactivity timeout (seconds)"
              type="number"
              inputProps={{ min: 5, max: 600 }}
              value={sessionReviewGraceSeconds}
              onChange={(event) => setSessionReviewGraceSecondsInput(event.target.value)}
              helperText="If a timer confirmation prompt is left idle, the app auto-continues after this timeout."
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
                const roundSeconds = Number(debugPomodoroSeconds);
                const shortBreakSeconds = Number(debugShortBreakSeconds);
                const longBreakSeconds = Number(debugLongBreakSeconds);
                const sessions = Number(sessionsBeforeLongBreak);
                const reviewTimeout = Number(sessionReviewGraceSeconds);
                const volume = Number(alarmVolume);
                if (!Number.isFinite(minutes) || !Number.isFinite(shortBreak) || !Number.isFinite(longBreak) || !Number.isFinite(roundSeconds) || !Number.isFinite(shortBreakSeconds) || !Number.isFinite(longBreakSeconds) || !Number.isFinite(sessions) || !Number.isFinite(reviewTimeout) || !Number.isFinite(volume)) return;
                if (minutes <= 0 || shortBreak <= 0 || longBreak <= 0 || roundSeconds <= 0 || shortBreakSeconds <= 0 || longBreakSeconds <= 0 || sessions <= 1 || reviewTimeout < 5 || reviewTimeout > 600 || volume < 0 || volume > 100) return;
                if (state.settings.debugModeEnabled) {
                  setDebugPomodoroSeconds(roundSeconds);
                  setDebugShortBreakSeconds(shortBreakSeconds);
                  setDebugLongBreakSeconds(longBreakSeconds);
                } else {
                  setPomodoroMinutes(minutes);
                  setShortBreakMinutes(shortBreak);
                  setLongBreakMinutes(longBreak);
                }
                setSessionsBeforeLongBreak(sessions);
                setSessionReviewGraceSeconds(reviewTimeout);
                setAlarmVolume(volume);
                setPomodoroMinutesInput(String(Math.round(minutes)));
                setShortBreakMinutesInput(String(Math.round(shortBreak)));
                setLongBreakMinutesInput(String(Math.round(longBreak)));
                setDebugPomodoroSecondsInput(String(Math.max(1, Math.round(roundSeconds))));
                setDebugShortBreakSecondsInput(String(Math.max(1, Math.round(shortBreakSeconds))));
                setDebugLongBreakSecondsInput(String(Math.max(1, Math.round(longBreakSeconds))));
                setSessionsBeforeLongBreakInput(String(Math.round(sessions)));
                setSessionReviewGraceSecondsInput(String(Math.max(5, Math.min(600, Math.round(reviewTimeout)))));
                setAlarmVolumeInput(String(Math.max(0, Math.min(100, Math.round(volume)))));
                showSuccessMessage('Timer settings saved.');
              }}
              disabled={
                !pomodoroMinutes.trim() ||
                !shortBreakMinutes.trim() ||
                !longBreakMinutes.trim() ||
                !debugPomodoroSeconds.trim() ||
                !debugShortBreakSeconds.trim() ||
                !debugLongBreakSeconds.trim() ||
                !sessionsBeforeLongBreak.trim() ||
                !sessionReviewGraceSeconds.trim() ||
                !alarmVolume.trim() ||
                Number(pomodoroMinutes) <= 0 ||
                Number(shortBreakMinutes) <= 0 ||
                Number(longBreakMinutes) <= 0 ||
                Number(debugPomodoroSeconds) <= 0 ||
                Number(debugShortBreakSeconds) <= 0 ||
                Number(debugLongBreakSeconds) <= 0 ||
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
            <Typography variant="h5">Recurring suggestion cool down</Typography>
            <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
              <Typography variant="body2" fontWeight={700} mb={0.5}>How this works</Typography>
              <Typography variant="body2">
                When enabled, weekly and monthly recurring tasks are hidden from &quot;Suggest recurring tasks&quot;
                if they were completed recently.
              </Typography>
              <Typography variant="body2" mt={1}>
                Set the cool down days to control how long a completed task stays out of suggestions.
              </Typography>
            </Alert>
            <FormControlLabel
              control={
                <Switch
                  checked={state.settings.recurringSuggestionCooldownEnabled}
                  onChange={(_, checked) => {
                    setRecurringSuggestionCooldownEnabled(checked);
                    showSuccessMessage(`Recurring suggestion cool down ${checked ? 'enabled' : 'disabled'}.`);
                  }}
                />
              }
              label="Enable recurring suggestion cool down"
            />
            <TextField
              label="Cool down period (days)"
              type="number"
              inputProps={{ min: 1 }}
              value={recurringSuggestionCooldownDays}
              onChange={(event) => setRecurringSuggestionCooldownDaysInput(event.target.value)}
              helperText="Only applies to weekly and day-of-month recurring tasks."
              disabled={!state.settings.recurringSuggestionCooldownEnabled}
            />
            <Button
              variant="contained"
              onClick={() => {
                const cooldownDays = Number(recurringSuggestionCooldownDays);
                if (!Number.isFinite(cooldownDays) || cooldownDays <= 0) return;
                setRecurringSuggestionCooldownDays(cooldownDays);
                setRecurringSuggestionCooldownDaysInput(String(Math.max(1, Math.round(cooldownDays))));
                showSuccessMessage('Recurring suggestion cool down saved.');
              }}
              disabled={
                !state.settings.recurringSuggestionCooldownEnabled
                || !recurringSuggestionCooldownDays.trim()
                || Number(recurringSuggestionCooldownDays) <= 0
              }
            >
              Save recurring suggestion cool down
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {showBatteryOptimizationSettingsCard ? (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Android battery optimization</Typography>
              <Alert severity="success" icon={<InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
                <Typography variant="body2" fontWeight={700} mb={0.5}>Why this matters</Typography>
                <Typography variant="body2">
                  Battery optimization can delay or silence timer completion notifications while your phone is in standby.
                </Typography>
                <Typography variant="body2" mt={1}>
                  If optimization is enabled, open system settings and set TaskTrack to unrestricted so alarms can run reliably.
                </Typography>
              </Alert>
              <Alert severity={batteryOptimizationEnabled ? 'warning' : 'success'}>
                {batteryOptimizationEnabled
                  ? 'Status: Android battery optimization is ON for TaskTrack.'
                  : 'Status: Android battery optimization is OFF for TaskTrack.'}
              </Alert>
              {batteryOptimizationError ? <Alert severity="error">{batteryOptimizationError}</Alert> : null}
              <Button
                variant="contained"
                onClick={() => {
                  openBatteryOptimizationSettings()
                    .then((opened) => {
                      if (!opened) return;
                      showSuccessMessage('Opened Android battery optimization settings.');
                    })
                    .catch(() => {
                      setBatteryOptimizationError('Could not open Android battery optimization settings.');
                    });
                }}
                disabled={batteryOptimizationLoading}
              >
                Open battery optimization settings
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setBatteryOptimizationLoading(true);
                  isBatteryOptimizationEnabled()
                    .then((enabled) => {
                      setBatteryOptimizationEnabled(enabled);
                      setBatteryOptimizationError(null);
                    })
                    .catch(() => {
                      setBatteryOptimizationError('Could not refresh Android battery optimization status.');
                    })
                    .finally(() => {
                      setBatteryOptimizationLoading(false);
                    });
                }}
                disabled={batteryOptimizationLoading}
              >
                Refresh optimization status
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

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

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Debug mode</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={state.settings.debugModeEnabled}
                  onChange={(_, checked) => {
                    setDebugModeEnabled(checked);
                    showSuccessMessage(`Debug timing mode ${checked ? 'enabled' : 'disabled'}.`);
                  }}
                />
              }
              label="Enable debug timing mode (set durations in seconds)"
            />
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
              You&apos;re all set, {state.userName.trim()}. Here&apos;s the quickest way to use TaskTrack day to day.
            </Typography>
            {firstTimeWorkflowSteps.map((step, index) => {
              const StepIcon = welcomeStepIcons[index];

              return (
                <Alert key={step.title} severity="success" icon={StepIcon ? <StepIcon fontSize="inherit" /> : <InfoOutlined fontSize="inherit" />} sx={guidanceAlertSx}>
                <Typography variant="body2" fontWeight={700} mb={0.5}>{step.title}</Typography>
                <Typography variant="body2">{step.description}</Typography>
              </Alert>
              );
            })}
            <Typography color="text.secondary">You can reopen similar hints anytime by enabling first-time guidance in Settings.</Typography>
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
