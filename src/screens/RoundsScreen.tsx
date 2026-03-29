import CircleOutlined from '@mui/icons-material/CircleOutlined';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

export const RoundsScreen = () => {
  const { state } = useAppState();
  const navigate = useNavigate();

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h3">Today's Rounds</Typography>
        <Typography color="text.secondary">Manage your focus sessions for the day.</Typography>
      </Box>
      {state.rounds.map((round) => (
        <Card key={round.id} sx={{ bgcolor: round.status === 'active' ? '#20201f' : '#1a1a1a' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h5">{round.title} ({round.durationMinutes} min)</Typography>
              <Chip label={round.scheduledTime} color={round.status === 'active' ? 'primary' : 'default'} />
            </Stack>
            <Stack spacing={1} mb={2}>
              {round.taskIds.map((taskId) => {
                const task = state.tasks.find((candidate) => candidate.id === taskId);
                if (!task) return null;
                return (
                  <Stack direction="row" spacing={1} alignItems="center" key={task.id}>
                    <CircleOutlined fontSize="small" color={task.status === 'done' ? 'success' : 'disabled'} />
                    <Typography>{task.title}</Typography>
                  </Stack>
                );
              })}
            </Stack>
            {round.status === 'active' && (
              <Button variant="contained" startIcon={<PlayArrowRounded />} onClick={() => navigate('/focus')}>
                Enter Focus Mode
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};
