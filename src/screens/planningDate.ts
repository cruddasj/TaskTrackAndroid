import { getTomorrowKey, getTodayKey } from '../utils';

export type PlanningDay = 'today' | 'tomorrow';

export const getPlanningDateFromDay = (planningDay: PlanningDay): string =>
  planningDay === 'today' ? getTodayKey() : getTomorrowKey();

export const getPlanningDayLabel = (planningDay: PlanningDay): string =>
  planningDay === 'today' ? 'Today' : 'Tomorrow';
