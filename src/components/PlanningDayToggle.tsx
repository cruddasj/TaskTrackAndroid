import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export type PlanningDay = 'today' | 'tomorrow';

interface PlanningDayToggleProps {
  value: PlanningDay;
  onChange: (value: PlanningDay) => void;
}

export const PlanningDayToggle = ({ value, onChange }: PlanningDayToggleProps) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    color="primary"
    value={value}
    onChange={(_, nextValue: PlanningDay | null) => {
      if (nextValue) onChange(nextValue);
    }}
    aria-label="planning-day-toggle"
    sx={{
      '& .MuiToggleButton-root': {
        px: 2.25,
        py: 0.75,
      },
    }}
  >
    <ToggleButton value="today">Today</ToggleButton>
    <ToggleButton value="tomorrow">Tomorrow</ToggleButton>
  </ToggleButtonGroup>
);
