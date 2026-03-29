import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListTodo, Timer } from "lucide-react";

const Navigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full glass pb-safe z-50 md:top-0 md:h-screen md:w-64 md:border-r md:border-surface-variant md:flex-col md:py-8">
      <div className="flex justify-around items-center p-4 md:flex-col md:gap-8 md:items-start md:px-6">
        <div className="hidden md:block mb-8">
          <h1 className="text-xl font-bold tracking-tight text-primary">
            TaskTrack
          </h1>
        </div>

        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 md:flex-row md:gap-4 md:w-full md:p-3 rounded-xl transition-colors ${
              isActive
                ? "text-primary md:bg-surface-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`
          }
        >
          <LayoutDashboard size={24} />
          <span className="text-xs md:text-sm font-medium">Dashboard</span>
        </NavLink>

        <NavLink
          to="/rounds"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 md:flex-row md:gap-4 md:w-full md:p-3 rounded-xl transition-colors ${
              isActive
                ? "text-primary md:bg-surface-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`
          }
        >
          <ListTodo size={24} />
          <span className="text-xs md:text-sm font-medium">Tasks</span>
        </NavLink>

        <NavLink
          to="/timer/active"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 md:flex-row md:gap-4 md:w-full md:p-3 rounded-xl transition-colors ${
              isActive
                ? "text-primary md:bg-surface-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`
          }
        >
          <Timer size={24} />
          <span className="text-xs md:text-sm font-medium">Timer</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
