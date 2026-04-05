export type FirstTimeWorkflowStep = {
  title: string;
  description: string;
};

export const getFirstTimeWorkflowSteps = (): FirstTimeWorkflowStep[] => [
  {
    title: '1) Dashboard: see what needs attention now',
    description: 'Use Dashboard to review today\'s progress, active round status, and quick actions before starting a focus session.',
  },
  {
    title: '2) Task Bank: collect everything you might work on',
    description: 'Add reusable or one-off tasks to your Task Bank so planning is faster each day.',
  },
  {
    title: '3) Tasks: choose what you want to finish today',
    description: 'Move tasks from Task Bank into Today\'s Tasks, then mark them done as you complete them.',
  },
  {
    title: '4) Rounds: group today\'s tasks for Pomodoro focus',
    description: 'Assign today\'s tasks into rounds, then start Focus to run work and break phases automatically.',
  },
];
