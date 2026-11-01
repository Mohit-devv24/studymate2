"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { Play, Pause, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

const TIMER_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function StudyTimerPage() {
  const [timerMode, setTimerMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATIONS.pomodoro);
  const [isActive, setIsActive] = useState(false);
  const [focusSessionId, setFocusSessionId] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleCompleteInterval();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = async () => {
    setIsActive(true);
    if (timerMode === "pomodoro" && !focusSessionId) {
      try {
        const res = await apiFetch("/api/study/focus/start", { method: "POST" });
        if (res.ok && res.data?.id) {
          setFocusSessionId(res.data.id);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(TIMER_DURATIONS[timerMode]);
  };

  const handleModeChange = (mode: TimerMode) => {
    setTimerMode(mode);
    setIsActive(false);
    setTimeLeft(TIMER_DURATIONS[mode]);
  };

  const handleCompleteInterval = async () => {
    setIsActive(false);
    try {
      confetti({ particleCount: 80, spread: 60 });
    } catch {}

    if (timerMode === "pomodoro") {
      setCompletedSessions((prev) => prev + 1);
      if (focusSessionId) {
        try {
          await apiFetch(`/api/study/focus/${focusSessionId}/finish`, {
            method: "POST",
            body: JSON.stringify({ completed: true }),
          });
          setFocusSessionId(null);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = TIMER_DURATIONS[timerMode];
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  return (
    <DashboardLayout
      title="Focus Study Timer"
      subtitle="Pomodoro technique intervals for distraction-free deep work"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)]">
          <button
            onClick={() => handleModeChange("pomodoro")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              timerMode === "pomodoro"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Study Focus (25m)
          </button>
          <button
            onClick={() => handleModeChange("shortBreak")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              timerMode === "shortBreak"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => handleModeChange("longBreak")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              timerMode === "longBreak"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Circular Display Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs text-center space-y-8">
          <div className="relative inline-flex items-center justify-center">
            {/* Countdown digits */}
            <div className="space-y-2">
              <span className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-[var(--ink)]">
                {formatTime(timeLeft)}
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                {isActive ? "Focus In Progress" : "Ready to Start"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full max-w-md mx-auto rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="px-8 py-3.5 rounded-2xl text-sm font-extrabold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
              >
                <Play size={18} className="fill-current" />
                <span>Start Focus</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-8 py-3.5 rounded-2xl text-sm font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-xs flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
              >
                <Pause size={18} className="fill-current" />
                <span>Pause Session</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="pt-4 border-t border-[var(--line)] flex items-center justify-center gap-6 text-xs text-[var(--ink-muted)]">
            <span>Completed Today: <strong className="text-[var(--ink)]">{completedSessions} intervals</strong></span>
            <span>•</span>
            <span>Focus Earned: <strong className="text-[var(--ink)]">{completedSessions * 25} minutes</strong></span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
