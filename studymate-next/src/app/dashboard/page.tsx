"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiFetch, getStoredUser } from "@/lib/api";
import {
  BrainCircuit,
  Sparkles,
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Plus,
  Play,
} from "lucide-react";

export default function DashboardPage() {
  const user = getStoredUser();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ total_xp: 120, current_streak: 3, highest_streak: 5 });
  const [studyGoal, setStudyGoal] = useState<any>({ target_minutes: 60, completed_minutes: 25, percentage: 42 });
  const [loading, setLoading] = useState(true);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");

  const loadDashboardData = async () => {
    try {
      const [subsRes, tasksRes, profRes, goalRes] = await Promise.allSettled([
        apiFetch("/api/subjects"),
        apiFetch("/api/tasks"),
        apiFetch("/api/gamification/profile"),
        apiFetch("/api/study/goal"),
      ]);

      if (subsRes.status === "fulfilled" && subsRes.value.ok) {
        setSubjects(subsRes.value.data || []);
      }
      if (tasksRes.status === "fulfilled" && tasksRes.value.ok) {
        setTasks(tasksRes.value.data || []);
      }
      if (profRes.status === "fulfilled" && profRes.value.ok) {
        setProfile(profRes.value.data || { total_xp: 150, current_streak: 3, highest_streak: 5 });
      }
      if (goalRes.status === "fulfilled" && goalRes.value.ok) {
        setStudyGoal(goalRes.value.data || { target_minutes: 60, completed_minutes: 30, percentage: 50 });
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleTask = async (id: number) => {
    try {
      await apiFetch(`/api/tasks/${id}/complete`, { method: "POST" });
      loadDashboardData();
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: t.completed ? 0 : 1 } : t))
      );
    }
  };

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: quickTaskTitle.trim() }),
      });
      setQuickTaskTitle("");
      loadDashboardData();
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const level = Math.floor((profile.total_xp || 0) / 100) + 1;
  const xpInCurrentLevel = (profile.total_xp || 0) % 100;

  return (
    <DashboardLayout
      title="Student Overview"
      subtitle="Welcome back to your personalized study workspace"
    >
      {/* Welcome & Streak Warm Paper Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#B87542] via-[#C98A58] to-[#9E6032] p-6 sm:p-8 text-white shadow-md">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              <Sparkles size={14} />
              <span>Level {level} Scholar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || "Student"}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 max-w-lg">
              You are on a <strong className="text-white font-bold underline decoration-amber-300">{profile.current_streak || 1}-day study streak</strong>. Keep up the momentum to unlock milestone badges!
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 sm:gap-4 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/25 self-start md:self-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-white">
                <Flame size={20} className="fill-current animate-bounce" />
                <span className="text-xl sm:text-2xl font-black">{profile.current_streak || 1}</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-amber-200">Day Streak</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-white">
                <Award size={20} />
                <span className="text-xl sm:text-2xl font-black">{profile.total_xp || 0}</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-amber-200">Total XP</p>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex justify-between text-xs text-amber-100 font-medium mb-1.5">
            <span>Level {level} Progress</span>
            <span>{xpInCurrentLevel} / 100 XP to Level {level + 1}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${xpInCurrentLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Test Generator Highlight Card */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0 font-bold">
              <BrainCircuit size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                  Adaptive Chapter Test Generator
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1 max-w-xl">
                Synthesize instant multiple-choice practice tests tailored specifically to your Course, Subject, and Chapter name with step-by-step explanations.
              </p>
            </div>
          </div>

          <Link
            href="/tests"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shrink-0"
          >
            <span>Launch Test Generator</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* 2-Column Grid: Today's Goal & Quick Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Study Goal */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Daily Study Goal
                </h3>
              </div>
              <span className="text-xs font-semibold text-[var(--ink-muted)]">
                Target: {studyGoal.target_minutes || 60}m
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--ink)]">
                  {studyGoal.completed_minutes || 0}{" "}
                  <span className="text-xs font-medium text-[var(--ink-muted)]">min completed</span>
                </span>
                <span className="text-xs font-bold text-[var(--accent)]">
                  {studyGoal.percentage || 0}%
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, studyGoal.percentage || 0)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            <p className="text-xs text-[var(--ink-muted)]">
              Ready to focus? Start a 25-minute Pomodoro session.
            </p>
            <Link
              href="/timer"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-light)] flex items-center gap-1.5 transition-colors"
            >
              <Play size={13} />
              <span>Start Timer</span>
            </Link>
          </div>
        </div>

        {/* Priority Study Tasks */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Study Tasks
                </h3>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                View All ({tasks.length})
              </Link>
            </div>

            {/* Quick Add Task */}
            <form onSubmit={handleAddQuickTask} className="flex gap-2 mb-4">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
              <button
                type="submit"
                className="p-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
                title="Add Task"
              >
                <Plus size={16} />
              </button>
            </form>

            {/* Task list preview */}
            <div className="space-y-2">
              {tasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--line)] hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                >
                  {t.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Circle size={16} className="text-[var(--ink-muted)] shrink-0" />
                  )}
                  <span
                    className={`text-xs font-medium truncate ${
                      t.completed
                        ? "line-through text-[var(--ink-muted)]"
                        : "text-[var(--ink)]"
                    }`}
                  >
                    {t.title}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-[var(--ink-muted)] text-center py-4">No tasks yet. Add one above!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Subjects Preview */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Enrolled Subjects ({subjects.length})
            </h3>
          </div>
          <Link
            href="/subjects"
            className="text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            Manage Subjects
          </Link>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--ink-muted)]">
            No subjects created yet.{" "}
            <Link href="/subjects" className="text-[var(--accent)] font-bold hover:underline">
              Add your first subject
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--ink)] truncate">
                    {sub.name}
                  </h4>
                  <Link
                    href={`/tests`}
                    className="text-[10px] text-[var(--accent)] font-semibold hover:underline"
                  >
                    Practice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
