import { useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Fab,
  IconButton,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TaskIcon from '@mui/icons-material/Task'
import TimerIcon from '@mui/icons-material/Timer'
import InsightsIcon from '@mui/icons-material/Insights'
import SettingsIcon from '@mui/icons-material/Settings'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AddIcon from '@mui/icons-material/Add'
import type { AppState, TabKey, TaskItem } from './types'
import { defaultState, loadState, saveState } from './storage'
import { notifyPomodoroComplete, playAlarmBell } from './notifications'

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const tabLabels: Record<TabKey, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  rounds: 'Rounds',
  insights: 'Insights'
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!state.pomodoro.running || state.pomodoro.paused) return

    const handle = setInterval(() => {
      setState((prev) => {
        const next = prev.pomodoro.remainingSeconds - 1
        if (next > 0) {
          return {
            ...prev,
            pomodoro: { ...prev.pomodoro, remainingSeconds: next }
          }
        }

        void notifyPomodoroComplete()
        playAlarmBell()

        return {
          ...prev,
          pomodoro: {
            ...prev.pomodoro,
            running: false,
            paused: false,
            remainingSeconds: prev.pomodoro.totalSeconds
          }
        }
      })
    }, 1000)

    return () => clearInterval(handle)
  }, [state.pomodoro.running, state.pomodoro.paused])

  const activeTask = useMemo(
    () => state.tasks.find((task) => task.id === state.pomodoro.activeTaskId) ?? state.tasks[0],
    [state.tasks, state.pomodoro.activeTaskId]
  )

  const toggleTask = (task: TaskItem) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    }))
  }

  const addTask = () => {
    const nextId = `t${state.tasks.length + 1}`
    setState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: nextId,
          title: `New task ${prev.tasks.length + 1}`,
          category: 'Inbox',
          completed: false,
          estimateMinutes: 25
        }
      ]
    }))
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Typography variant="h4" color="primary.main">TaskTrack</Typography>
          <IconButton color="primary"><SettingsIcon /></IconButton>
        </Stack>

        <Typography variant="h2" sx={{ fontSize: { xs: 52, sm: 64 }, mb: 1 }}>Today's Rounds</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Manage your focus sessions for the day.</Typography>

        {state.selectedTab !== 'insights' && (
          <Card sx={{ mb: 3, background: 'radial-gradient(circle at 40% 20%, rgba(145,247,142,.16), rgba(14,14,14,1) 70%)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Chip color="primary" variant="outlined" label="Deep Focus Mode" />
                <Typography color="primary.main">LIVE SESSION</Typography>
              </Stack>

              <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
                <Box
                  sx={{
                    width: 280,
                    height: 280,
                    borderRadius: '50%',
                    border: '8px solid #2b2b2b',
                    borderTopColor: 'primary.main',
                    borderRightColor: 'primary.main',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ fontSize: 64 }}>{formatTime(state.pomodoro.remainingSeconds)}</Typography>
                    <Typography color="text.secondary" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Remaining</Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="h4" sx={{ textAlign: 'center' }}>{activeTask?.title ?? 'Pick a Task'}</Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>Current sprint task</Typography>

              <Stack direction="row" justifyContent="center" spacing={2}>
                <IconButton
                  onClick={() => setState((prev) => ({ ...prev, pomodoro: { ...prev.pomodoro, remainingSeconds: prev.pomodoro.totalSeconds } }))}
                >
                  <RestartAltIcon />
                </IconButton>
                <Fab
                  color="primary"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      pomodoro: {
                        ...prev.pomodoro,
                        running: true,
                        paused: prev.pomodoro.running ? !prev.pomodoro.paused : false
                      }
                    }))
                  }
                >
                  {state.pomodoro.running && !state.pomodoro.paused ? <PauseIcon /> : <PlayArrowIcon />}
                </Fab>
              </Stack>
            </CardContent>
          </Card>
        )}

        {state.selectedTab === 'tasks' && (
          <Stack spacing={2}>
            {state.tasks.map((task) => (
              <Card key={task.id} sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" sx={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</Typography>
                    <Typography color="text.secondary">{task.category} • {task.estimateMinutes} min</Typography>
                  </Box>
                  <Button
                    variant={task.completed ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => toggleTask(task)}
                  >
                    {task.completed ? 'Done' : 'Mark'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {state.selectedTab === 'rounds' && (
          <Stack spacing={2}>
            {state.rounds.map((round) => (
              <Card key={round.id} sx={{ bgcolor: '#1a1a1a' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">{round.title} ({round.durationMinutes} min)</Typography>
                    <Chip label={round.startTime} color={round.status === 'active' ? 'primary' : 'default'} />
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>{round.tasks.length} tasks assigned</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {state.selectedTab === 'dashboard' && (
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 1 }}>Today's Progress</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Completed {state.tasks.filter((t) => t.completed).length} of {state.tasks.length} tasks
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(state.tasks.filter((t) => t.completed).length / state.tasks.length) * 100}
                  color="primary"
                />
              </CardContent>
            </Card>
            {state.tasks.slice(0, 3).map((task) => (
              <Card key={task.id}>
                <CardContent>
                  <Typography variant="h6">{task.title}</Typography>
                  <Typography color="text.secondary">{task.category}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {state.selectedTab === 'insights' && (
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>Round Analytics</Typography>
              <Typography color="text.secondary">Daily focus velocity: 78%</Typography>
              <Typography color="text.secondary">Total focus: 1h 12m</Typography>
              <Typography color="text.secondary">Rounds done: 2 of 4</Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      <Fab color="primary" sx={{ position: 'fixed', right: 16, bottom: 86 }} onClick={addTask}>
        <AddIcon />
      </Fab>

      <AppBar position="fixed" color="transparent" sx={{ top: 'auto', bottom: 0, backdropFilter: 'blur(12px)' }}>
        <BottomNavigation
          showLabels
          value={state.selectedTab}
          onChange={(_, newTab) => setState((prev) => ({ ...prev, selectedTab: newTab as TabKey }))}
          sx={{ bgcolor: 'rgba(26,26,26,0.8)', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        >
          <BottomNavigationAction value="dashboard" label={tabLabels.dashboard} icon={<DashboardIcon />} />
          <BottomNavigationAction value="tasks" label={tabLabels.tasks} icon={<TaskIcon />} />
          <BottomNavigationAction value="rounds" label={tabLabels.rounds} icon={<TimerIcon />} />
          <BottomNavigationAction value="insights" label={tabLabels.insights} icon={<InsightsIcon />} />
        </BottomNavigation>
      </AppBar>
    </Box>
  )
}
