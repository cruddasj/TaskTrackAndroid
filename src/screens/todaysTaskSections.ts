import { Task } from '../types';

interface TaskSections {
  todo: Task[];
  done: Task[];
}

export const getTaskSections = (tasks: Task[]): TaskSections => ({
  todo: tasks.filter((task) => task.status !== 'done'),
  done: tasks.filter((task) => task.status === 'done'),
});
