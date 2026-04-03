import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export type PlanningDayOption = 'today' | 'tomorrow';

interface PlanningDayToggleProps {
  value: PlanningDayOption;
  onChange: (value: PlanningDayOption) => void;
}

export const PlanningDayToggle = ({ value, onChange }: PlanningDayToggleProps) => (
  <ToggleButtonGroup
    color="primary"
    size="small"
    exclusive
    value={value}
    onChange={(_, nextValue: PlanningDayOption | null) => {
      if (nextValue) onChange(nextValue);
    }}
  >
    <ToggleButton value="today">Today</ToggleButton>
    <ToggleButton value="tomorrow">Tomorrow</ToggleButton>
  </ToggleButtonGroup>
);
