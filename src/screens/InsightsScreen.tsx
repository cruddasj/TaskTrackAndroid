import { Card, CardContent, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { useAppState } from '../state/AppStateContext';

export const InsightsScreen = () => {
  const { state } = useAppState();
  const done = state.tasks.filter((task) => task.status === 'done').length;
  const progress = state.tasks.length ? Math.round((done / state.tasks.length) * 100) : 0;

  return (
    <Stack spacing={2}>
      <Typography variant="h3">Round Analytics</Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">Daily Velocity</Typography>
          <Typography variant="h3" color="primary.main">{progress}%</Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 99 }} />
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <Card><CardContent><Typography color="text.secondary">Total focus</Typography><Typography variant="h4">142m</Typography></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card><CardContent><Typography color="text.secondary">Rounds done</Typography><Typography variant="h4">06</Typography></CardContent></Card>
        </Grid>
      </Grid>
    </Stack>
  );
};
