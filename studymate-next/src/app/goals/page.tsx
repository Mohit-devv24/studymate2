"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { Clock, CheckCircle2, Circle } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  targetMinutes: number;
  completedMinutes: number;
}

export default function GoalsPage() {
  const [dailyTarget, setDailyTarget] = useState(60);
  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", title: "Complete 10 OS Chapter Tests", targetMinutes: 150, completedMinutes: 90 },
    { id: "2", title: "Master DBMS SQL Normalization", targetMinutes: 120, completedMinutes: 120 },
    { id: "3", title: "Review Engineering Physics Waves", targetMinutes: 80, completedMinutes: 30 },
  ]);

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newTarget, setNewTarget] = useState(60);

  useEffect(() => {
    async function loadStudyGoal() {
      try {
        const res = await apiFetch("/api/study/goal");
        if (res.ok && res.data?.target_minutes) {
          setDailyTarget(res.data.target_minutes);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadStudyGoal();
  }, []);

  const handleUpdateDailyGoal = async (minutes: number) => {
    setDailyTarget(minutes);
    try {
      await apiFetch("/api/study/goal", {
        method: "POST",
        body: JSON.stringify({ target_minutes: minutes }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const g: Goal = {
      id: Date.now().toString(),
      title: newGoalTitle.trim(),
      targetMinutes: newTarget,
      completedMinutes: 0,
    };
    setGoals([...goals, g]);
    setNewGoalTitle("");
  };

  return (
    <DashboardLayout
      title="Academic Goals"
      subtitle="Define daily study targets and milestone completion benchmarks"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Goal Configuration Card */}
        <div className="bg-[var(--surface)] rounded-3xl border border-[var(--line)] p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--line)]">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">
                Daily Study Target
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">Minutes you commit to study per day</p>
            </div>
          </div>

          <div className="text-center py-4">
            <span className="text-4xl sm:text-5xl font-black text-[var(--accent)]">
              {dailyTarget}
            </span>
            <span className="text-sm font-bold text-[var(--ink-muted)] ml-1">minutes/day</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[30, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleUpdateDailyGoal(mins)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dailyTarget === mins
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] text-[var(--ink)]"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Add Goal Milestone */}
          <div className="pt-4 border-t border-[var(--line)]">
            <h4 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-3">
              Add Academic Milestone
            </h4>
            <form onSubmit={handleAddGoal} className="space-y-3">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g. Master Calculus Limits..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(Number(e.target.value))}
                  min={10}
                  step={10}
                  className="w-24 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                />
                <span className="text-xs text-[var(--ink-muted)]">target min</span>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs transition-all cursor-pointer"
              >
                Create Milestone
              </button>
            </form>
          </div>
        </div>

        {/* Milestone Goals List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-[var(--ink)]">
            Current Milestones ({goals.length})
          </h3>

          <div className="space-y-3">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.completedMinutes / g.targetMinutes) * 100));
              const isFinished = pct >= 100;

              return (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isFinished ? (
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={20} className="text-[var(--accent)] shrink-0" />
                      )}
                      <h4
                        className={`text-sm font-bold ${
                          isFinished ? "line-through text-[var(--ink-muted)]" : "text-[var(--ink)]"
                        }`}
                      >
                        {g.title}
                      </h4>
                    </div>

                    <span className="text-xs font-bold text-[var(--ink-secondary)]">
                      {g.completedMinutes} / {g.targetMinutes}m ({pct}%)
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished ? "bg-emerald-500" : "bg-[var(--accent)]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
