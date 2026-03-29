import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTasks } from "../context/TaskContext";
import { Play, Pause, Square, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { LocalNotifications } from "@capacitor/local-notifications";

const ActiveTimer: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, completeRound } = useTasks();
  const navigate = useNavigate();

  const task = tasks.find((t) => t.id === taskId);

  const [timeLeft, setTimeLeft] = useState((task?.duration || 25) * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    );
  }, []);

  const handleSessionComplete = async () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.play();
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Session Complete!",
            body: `You finished a round for: ${task?.title}`,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: "beep.wav",
            actionTypeId: "",
            extra: null,
          },
        ],
      });
    } catch (e) {
      console.warn("Local Notifications not available", e);
      // Fallback for web
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Session Complete!", {
            body: `You finished a round for: ${task?.title}`,
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("Session Complete!", {
                body: `You finished a round for: ${task?.title}`,
              });
            }
          });
        }
      }
    }

    if (task) {
      completeRound(task.id);
    }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleSessionComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const stopTimer = () => {
    setIsActive(false);
    navigate("/");
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Task not found</h2>
          <button
            onClick={() => navigate("/")}
            className="text-primary underline"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage =
    ((task.duration * 60 - timeLeft) / (task.duration * 60)) * 100;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Background Glows */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ease-in-out ${isActive ? "bg-primary/20 scale-110" : "bg-surface-variant/30 scale-100"}`}
      ></div>

      <header className="p-6 relative z-10 flex justify-between items-center backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-bright flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={24} className="text-on-surface" />
        </button>

        <div className="text-center flex-1 mx-4">
          <p className="text-on-surface-variant text-sm font-bold tracking-widest uppercase mb-1">
            {task.category}
          </p>
          <h1 className="text-xl font-bold truncate">{task.title}</h1>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-bright flex items-center justify-center transition-colors"
        >
          {isMuted ? (
            <VolumeX size={20} className="text-on-surface-variant" />
          ) : (
            <Volume2 size={20} className="text-on-surface" />
          )}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Timer Display */}
        <div className="relative mb-16 mt-8 w-80 h-80 md:w-96 md:h-96">
          {/* Progress Ring */}
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              className="stroke-surface-container-highest fill-none"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="48"
              className="stroke-primary fill-none transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(145,247,142,0.5)]"
              strokeWidth="4"
              strokeDasharray="301.59"
              style={{
                strokeDashoffset: `${301.59 - (progressPercentage / 100) * 301.59}`,
              }}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div
              className={`text-6xl md:text-7xl font-black tracking-tighter tabular-nums transition-colors duration-300 ${isActive ? "text-primary text-shadow-glow" : "text-on-surface"}`}
            >
              {formatTime(timeLeft)}
            </div>
            {task.rounds > 1 && (
              <div className="mt-4 text-on-surface-variant font-bold tracking-widest text-sm uppercase">
                Round {task.currentRound + 1} of {task.rounds}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-8">
          <button
            onClick={stopTimer}
            className="w-16 h-16 rounded-full bg-surface-container hover:bg-error-container text-on-surface hover:text-on-error-container flex items-center justify-center transition-colors group shadow-lg"
          >
            <Square
              size={24}
              className="group-hover:scale-110 transition-transform"
            />
          </button>
          <button
            onClick={toggleTimer}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isActive
                ? "bg-surface-container-highest text-primary hover:bg-surface-bright"
                : "bg-primary text-on-primary hover:bg-primary-container shadow-primary/30"
            }`}
          >
            {isActive ? (
              <Pause size={40} className="fill-current" />
            ) : (
              <Play size={40} className="fill-current ml-2" />
            )}
          </button>
          <div className="w-16 h-16 opacity-0"></div> {/* Spacer for balance */}
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="p-8 text-center relative z-10 text-on-surface-variant text-sm font-medium">
        Stay focused. Minimize distractions.
      </footer>
    </div>
  );
};

export default ActiveTimer;
