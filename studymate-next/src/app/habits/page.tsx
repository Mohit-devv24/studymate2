"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Flame, Plus, Check } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDays: boolean[]; // 7 days of this week
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", name: "Daily 25m Focused Study", streak: 5, completedDays: [true, true, true, true, true, false, false] },
    { id: "2", name: "Solve 1 Chapter Test Daily", streak: 3, completedDays: [true, true, true, false, false, false, false] },
    { id: "3", name: "Revise Lecture Formulas", streak: 4, completedDays: [true, false, true, true, true, false, false] },
  ]);

  const [newHabitName, setNewHabitName] = useState("");

  const handleToggleDay = (habitId: string, dayIndex: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const nextDays = [...h.completedDays];
        nextDays[dayIndex] = !nextDays[dayIndex];
        const newStreak = nextDays.filter(Boolean).length;
        return { ...h, completedDays: nextDays, streak: newStreak };
      })
    );
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newH: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      streak: 0,
      completedDays: [false, false, false, false, false, false, false],
    };

    setHabits([...habits, newH]);
    setNewHabitName("");
  };

  return (
    <DashboardLayout
      title="Study Habits & Streaks"
      subtitle="Build long-term learning consistency with visual 7-day tracker grids"
    >
      <div className="space-y-6">
        {/* Add Habit Bar */}
        <form onSubmit={handleAddHabit} className="flex gap-2 max-w-lg">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="New study habit (e.g. Read 1 Research Paper)..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Habit</span>
          </button>
        </form>

        {/* Habits Table / Grid */}
        <div className="bg-[var(--surface)] rounded-3xl border border-[var(--line)] p-6 shadow-xs overflow-x-auto">
          <div className="min-w-[600px] space-y-4">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-3 pb-3 border-b border-[var(--line)] text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="col-span-4">Habit</span>
              <span className="col-span-2 text-center">Current Streak</span>
              <div className="col-span-6 grid grid-cols-7 gap-2 text-center">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            {/* Habit Rows */}
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="grid grid-cols-12 gap-3 items-center py-2.5 border-b border-[var(--line)]/50 last:border-none"
              >
                <div className="col-span-4">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate">
                    {habit.name}
                  </h4>
                </div>

                <div className="col-span-2 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--accent)] bg-[var(--accent-light)] px-2 py-1 rounded-lg">
                    <Flame size={13} className="fill-current" />
                    <span>{habit.streak} days</span>
                  </span>
                </div>

                <div className="col-span-6 grid grid-cols-7 gap-2">
                  {habit.completedDays.map((isDone, dayIdx) => (
                    <button
                      key={dayIdx}
                      type="button"
                      onClick={() => handleToggleDay(habit.id, dayIdx)}
                      className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isDone
                          ? "bg-[var(--accent)] text-white shadow-xs"
                          : "bg-[var(--surface-2)] border border-[var(--line)] hover:bg-[var(--surface-3)] text-transparent"
                      }`}
                      title={WEEKDAYS[dayIdx]}
                    >
                      <Check size={14} className={isDone ? "opacity-100" : "opacity-0"} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
