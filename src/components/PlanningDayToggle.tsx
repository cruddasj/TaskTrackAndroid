import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { PlanningDay } from '../screens/planningDate';

interface PlanningDayToggleProps {
  value: PlanningDay;
  onChange: (value: PlanningDay) => void;
}

export const PlanningDayToggle = ({ value, onChange }: PlanningDayToggleProps) => {
  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">Planning day</Typography>
      <ToggleButtonGroup
        size="small"
        color="primary"
        exclusive
        value={value}
        onChange={(_, nextValue: PlanningDay | null) => {
          if (!nextValue) return;
          onChange(nextValue);
        }}
        aria-label="planning-day-toggle"
      >
        <ToggleButton value="today">Today</ToggleButton>
        <ToggleButton value="tomorrow">Tomorrow</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};
