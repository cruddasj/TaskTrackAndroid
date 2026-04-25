import { Task, TaskBankItem } from '../types';

const isString = (value: unknown): value is string => typeof value === 'string';

export const normalizeDependencyIds = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const normalized = value
    .filter(isString)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (normalized.length === 0) return undefined;

  return Array.from(new Set(normalized));
};

export const getTaskBankCyclePath = (
  items: Pick<TaskBankItem, 'id' | 'prerequisiteTaskBankItemIds'>[],
): string[] | null => {
  const idSet = new Set(items.map((item) => item.id));
  const edges = new Map<string, string[]>();
  items.forEach((item) => {
    edges.set(
      item.id,
      (item.prerequisiteTaskBankItemIds ?? []).filter((prerequisiteId) => idSet.has(prerequisiteId) && prerequisiteId !== item.id),
    );
  });

  const visitState = new Map<string, 'visiting' | 'visited'>();
  const pathStack: string[] = [];

  const findCycle = (nodeId: string): string[] | null => {
    const state = visitState.get(nodeId);
    if (state === 'visiting') {
      const cycleStartIndex = pathStack.indexOf(nodeId);
      if (cycleStartIndex < 0) return [nodeId];
      return [...pathStack.slice(cycleStartIndex), nodeId];
    }
    if (state === 'visited') return null;

    visitState.set(nodeId, 'visiting');
    pathStack.push(nodeId);

    const neighbors = edges.get(nodeId) ?? [];
    for (const neighborId of neighbors) {
      const cycle = findCycle(neighborId);
      if (cycle) return cycle;
    }

    pathStack.pop();
    visitState.set(nodeId, 'visited');
    return null;
  };

  const sortedIds = Array.from(idSet).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));

  for (const id of sortedIds) {
    const cycle = findCycle(id);
    if (cycle) return cycle;
  }

  return null;
};

export const canSaveTaskBankItemWithoutCycle = (
  items: Pick<TaskBankItem, 'id' | 'prerequisiteTaskBankItemIds'>[],
  candidate: Pick<TaskBankItem, 'id' | 'prerequisiteTaskBankItemIds'>,
): boolean => {
  const nextItems = items.some((item) => item.id === candidate.id)
    ? items.map((item) => (item.id === candidate.id ? candidate : item))
    : [...items, candidate];
  return !getTaskBankCyclePath(nextItems);
};

export const mapTaskBankPrerequisiteIdsToTaskIds = (
  taskBankItem: Pick<TaskBankItem, 'id' | 'prerequisiteTaskBankItemIds'>,
  tasksForDate: Pick<Task, 'id' | 'sourceTaskBankItemId'>[],
): string[] | undefined => {
  const prerequisiteIds = taskBankItem.prerequisiteTaskBankItemIds ?? [];
  if (prerequisiteIds.length === 0) return undefined;

  const taskIdBySourceBankId = new Map<string, string>();
  tasksForDate.forEach((task) => {
    if (!task.sourceTaskBankItemId) return;
    if (!taskIdBySourceBankId.has(task.sourceTaskBankItemId)) {
      taskIdBySourceBankId.set(task.sourceTaskBankItemId, task.id);
    }
  });

  const mappedTaskIds = prerequisiteIds
    .map((bankId) => taskIdBySourceBankId.get(bankId))
    .filter((taskId): taskId is string => Boolean(taskId));

  if (mappedTaskIds.length === 0) return undefined;

  return Array.from(new Set(mappedTaskIds));
};
