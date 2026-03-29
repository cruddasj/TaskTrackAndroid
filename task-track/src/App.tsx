import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TaskDashboard from "./pages/TaskDashboard";
import RoundsView from "./pages/RoundsView";
import ActiveTimer from "./pages/ActiveTimer";
import { TaskProvider } from "./context/TaskContext";
import { LocalNotifications } from "@capacitor/local-notifications";

const App: React.FC = () => {
  useEffect(() => {
    // Request permission for notifications on startup (Capacitor)
    LocalNotifications.requestPermissions().then((res) => {
      console.log("Notification permissions:", res);
    });
  }, []);

  return (
    <TaskProvider>
      <Router>
        <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container antialiased">
          <Routes>
            <Route path="/" element={<TaskDashboard />} />
            <Route path="/rounds" element={<RoundsView />} />
            <Route path="/timer/:taskId" element={<ActiveTimer />} />
          </Routes>
        </div>
      </Router>
    </TaskProvider>
  );
};

export default App;
