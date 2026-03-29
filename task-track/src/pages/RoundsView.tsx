import React, { useState } from "react";
import Navigation from "../components/Navigation";
import { useTasks } from "../context/TaskContext";
import { useNavigate } from "react-router-dom";
import {
  Play,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";

const RoundsView: React.FC = () => {
  const { tasks, toggleTaskCompletion } = useTasks();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"All" | "Active" | "Completed">(
    "Active",
  );

  const filteredTasks = tasks.filter((task) => {
    if (filter === "All") return true;
    if (filter === "Active") return !task.completed;
    return task.completed;
  });

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64 flex text-on-surface">
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto w-full animate-in slide-in-from-right duration-300">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md p-6 border-b border-surface-variant flex items-center gap-6">
          <button
            className="text-on-surface-variant hover:text-on-surface p-2 -ml-2 rounded-full transition-colors md:hidden"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">
              Task Bank
            </h1>
            <p className="text-on-surface-variant mt-1 text-sm font-medium">
              Manage and organize your priorities
            </p>
          </div>
        </header>

        <div className="p-6 md:p-12 space-y-8">
          {/* Filters */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
            {(["All", "Active", "Completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                    : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center p-12 bg-surface-container-low rounded-3xl border border-surface-variant border-dashed">
                <p className="text-on-surface-variant mb-4">
                  No tasks found for this filter.
                </p>
                <button className="bg-primary/10 text-primary px-6 py-2 rounded-full font-bold hover:bg-primary/20 transition-colors">
                  Add New Task
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-surface-container-low rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:bg-surface-container transition-all cursor-pointer border ${task.completed ? "border-primary/20" : "border-transparent"}`}
                  onClick={() =>
                    !task.completed && navigate(`/timer/${task.id}`)
                  }
                >
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      className="mt-1 flex-shrink-0 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompletion(task.id);
                      }}
                    >
                      {task.completed ? (
                        <CheckCircle2 size={24} className="text-primary" />
                      ) : (
                        <Circle
                          size={24}
                          className="text-on-surface-variant group-hover:text-primary transition-colors"
                        />
                      )}
                    </button>

                    <div className="flex-1">
                      <h4
                        className={`font-bold text-xl mb-1 transition-colors ${task.completed ? "text-on-surface-variant line-through" : "text-on-surface"}`}
                      >
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest font-medium uppercase tracking-wider text-[10px]">
                          {task.category}
                        </span>
                        <span>•</span>
                        <span>{task.duration}m duration</span>
                        {task.rounds > 1 && (
                          <>
                            <span>•</span>
                            <span>
                              Round {task.currentRound}/{task.rounds}
                            </span>
                          </>
                        )}
                        {task.priority === "High" && (
                          <>
                            <span>•</span>
                            <span className="text-error font-medium">
                              High Priority
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!task.completed && (
                      <button
                        className="flex-1 sm:flex-none bg-primary text-on-primary py-2 px-6 rounded-full font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/timer/${task.id}`);
                        }}
                      >
                        <Play size={16} /> Start
                      </button>
                    )}
                    <button
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-colors"
                      onClick={(e) => {
                        e.stopPropagation(); /* open menu */
                      }}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoundsView;
