import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const completed = state.tasks.filter((task) => task.status === 'done').length;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3">Good Morning, Alex</Typography>
        <Typography color="text.secondary">Ready for your morning rounds?</Typography>
      </Box>

      <Card sx={{ background: 'radial-gradient(circle at 65% 40%, rgba(145,247,142,0.28), rgba(14,14,14,1) 60%)' }}>
        <CardContent>
          <Typography variant="overline" color="primary.main" letterSpacing="0.08em">
            Active session
          </Typography>
          <Typography variant="h4" mt={1} mb={2}>
            Focus on your primary morning flow
          </Typography>
          <Button size="large" variant="contained" startIcon={<PlayArrowRounded />} onClick={() => navigate('/focus')}>
            Start Round
          </Button>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary">Tasks done</Typography>
            <Typography variant="h4">{completed} / {state.tasks.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary">Time tracked</Typography>
            <Typography variant="h4">2.4 hrs</Typography>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
};
