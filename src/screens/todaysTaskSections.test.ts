import { Task } from '../types';
import { getTaskSections } from './todaysTaskSections';

const buildTask = (id: string, title: string, status: Task['status']): Task => ({
  id,
  title,
  description: '',
  category: 'General',
  estimateMinutes: 25,
  status,
  plannedDate: '2026-04-04',
});

describe('getTaskSections', () => {
  it('places to-do tasks first and done tasks second while preserving existing order in each section', () => {
    const tasks: Task[] = [
      buildTask('1', 'Alpha', 'done'),
      buildTask('2', 'Bravo', 'todo'),
      buildTask('3', 'Charlie', 'done'),
      buildTask('4', 'Delta', 'todo'),
    ];

    const sections = getTaskSections(tasks);

    expect(sections.todo.map((task) => task.title)).toEqual(['Bravo', 'Delta']);
    expect(sections.done.map((task) => task.title)).toEqual(['Alpha', 'Charlie']);
  });
});
