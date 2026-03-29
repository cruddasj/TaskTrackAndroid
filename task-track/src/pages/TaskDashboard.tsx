import React from "react";
import Navigation from "../components/Navigation";
import { useTasks } from "../context/TaskContext";
import { useNavigate } from "react-router-dom";
import { Play, MoreVertical, Plus } from "lucide-react";

const TaskDashboard: React.FC = () => {
  const { tasks } = useTasks();
  const navigate = useNavigate();

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Stats calculation
  const totalTasks = tasks.length;
  const progressPercent =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks.length / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64 flex text-on-surface">
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto p-6 md:p-12 w-full animate-in fade-in duration-500">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="text-on-surface-variant font-medium tracking-widest text-sm mb-2 uppercase">
              Today's Focus
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Welcome back.
            </h2>
          </div>
          <button className="bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary-container transition-all shadow-lg shadow-primary/20">
            <Plus size={24} />
          </button>
        </header>

        {/* Hero Stat Section */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 bg-surface-container rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <h3 className="text-xl font-bold mb-6 relative z-10">
              Daily Progress
            </h3>

            <div className="flex items-end gap-6 relative z-10">
              <div className="text-7xl font-bold text-primary tracking-tighter">
                {progressPercent}%
              </div>
              <div className="pb-2">
                <p className="text-on-surface-variant">
                  {completedTasks.length} of {totalTasks} tasks completed
                </p>
              </div>
            </div>

            <div className="w-full bg-surface-container-highest h-3 rounded-full mt-8 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-surface-container rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-on-surface-variant font-medium mb-2">
                Active Task
              </h3>
              {activeTasks.length > 0 ? (
                <>
                  <p className="text-2xl font-bold mb-4">
                    {activeTasks[0].title}
                  </p>
                  <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                    {activeTasks[0].category}
                  </span>
                </>
              ) : (
                <p className="text-on-surface-variant">All caught up!</p>
              )}
            </div>

            {activeTasks.length > 0 && (
              <button
                onClick={() => navigate(`/timer/${activeTasks[0].id}`)}
                className="mt-6 w-full bg-surface-container-highest hover:bg-surface-bright text-on-surface py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={18} className="text-primary" /> Start Timer
              </button>
            )}
          </div>
        </section>

        {/* Up Next List */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Up Next</h3>
            <button
              className="text-primary text-sm font-bold hover:underline"
              onClick={() => navigate("/rounds")}
            >
              View All
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {activeTasks.slice(1, 4).map((task) => (
              <div
                key={task.id}
                className="bg-surface-container-low rounded-2xl p-5 flex justify-between items-center hover:bg-surface-container transition-colors group cursor-pointer"
                onClick={() => navigate(`/timer/${task.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                    {task.duration}m
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{task.title}</h4>
                    <p className="text-on-surface-variant text-sm mt-1">
                      {task.category}
                    </p>
                  </div>
                </div>

                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors"
                  onClick={(e) => {
                    e.stopPropagation(); /* handle menu */
                  }}
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            ))}

            {activeTasks.length === 0 && (
              <div className="text-center p-12 bg-surface-container-low rounded-3xl border border-surface-variant border-dashed">
                <p className="text-on-surface-variant">
                  No pending tasks. Enjoy your free time!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TaskDashboard;
