import React, { createContext, useContext, useState, useEffect } from "react";

export type Task = {
  id: string;
  title: string;
  category: string;
  duration: number; // in minutes
  completed: boolean;
  rounds: number;
  currentRound: number;
  priority: "High" | "Medium" | "Low";
  assignedTo?: string;
  dueDate?: string;
};

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "completed" | "currentRound">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  completeRound: (id: string) => void;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const STORAGE_KEY = "tasktrack_data";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Deep Clean Kitchen",
    category: "Kitchen",
    duration: 45,
    completed: false,
    rounds: 3,
    currentRound: 0,
    priority: "High",
    assignedTo: "Alex",
    dueDate: "Today",
  },
  {
    id: "2",
    title: "Organize Garage",
    category: "Garage",
    duration: 60,
    completed: false,
    rounds: 4,
    currentRound: 1,
    priority: "Medium",
    assignedTo: "Sam",
    dueDate: "Tomorrow",
  },
  {
    id: "3",
    title: "Pay Bills",
    category: "Admin",
    duration: 25,
    completed: false,
    rounds: 1,
    currentRound: 0,
    priority: "High",
  },
  {
    id: "4",
    title: "Water Plants",
    category: "Garden",
    duration: 15,
    completed: true,
    rounds: 1,
    currentRound: 1,
    priority: "Low",
  },
  {
    id: "5",
    title: "Meal Prep",
    category: "Kitchen",
    duration: 90,
    completed: false,
    rounds: 4,
    currentRound: 0,
    priority: "Medium",
    assignedTo: "Alex",
    dueDate: "Sunday",
  },
];

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialTasks;
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (
    taskData: Omit<Task, "id" | "completed" | "currentRound">,
  ) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      currentRound: 0,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return { ...t, completed: !t.completed };
        }
        return t;
      }),
    );
  };

  const completeRound = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextRound = t.currentRound + 1;
          const isCompleted = nextRound >= t.rounds;
          return { ...t, currentRound: nextRound, completed: isCompleted };
        }
        return t;
      }),
    );
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        completeRound,
        activeTaskId,
        setActiveTaskId,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used within a TaskProvider");
  return context;
};
