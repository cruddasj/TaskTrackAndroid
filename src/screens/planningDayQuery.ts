export const getPlanningDayFromQuery = (queryPlanningDay: string | null): 'today' | 'tomorrow' =>
  queryPlanningDay === 'tomorrow' ? 'tomorrow' : 'today';
