"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  type: "exam" | "deadline" | "review";
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [today, setToday] = useState<{ day: number; month: number; year: number } | null>(null);
  const [events] = useState<CalendarEvent[]>([
    { id: "1", day: 12, title: "OS Midterm Exam", type: "exam" },
    { id: "2", day: 18, title: "DBMS Lab Submission", type: "deadline" },
    { id: "3", day: 24, title: "Maths Chapter Test", type: "review" },
  ]);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setToday({
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
    });
  }, []);

  const year = currentDate ? currentDate.getFullYear() : 2026;
  const month = currentDate ? currentDate.getMonth() : 10;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <DashboardLayout
      title="Study Calendar"
      subtitle="Track your upcoming exams, assignment deadlines, and test revisions"
    >
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--line)] p-6 shadow-xs space-y-6">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)]">
                {monthNames[month]} {year}
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">Upcoming Academic Deadlines</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of Week header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 rounded-2xl bg-[var(--surface-2)]/40 border border-transparent" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = events.filter((e) => e.day === dayNum);
            const isToday = Boolean(
              today &&
              dayNum === today.day &&
              month === today.month &&
              year === today.year
            );

            return (
              <div
                key={dayNum}
                className={`h-24 p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? "bg-[var(--accent)] text-white shadow-xs"
                        : "text-[var(--ink)]"
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                <div className="space-y-1 overflow-hidden">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${
                        ev.type === "exam"
                          ? "bg-[var(--danger-bg)] text-[var(--danger)]"
                          : ev.type === "deadline"
                          ? "bg-[var(--warning-bg)] text-[var(--warning)]"
                          : "bg-[var(--accent-light)] text-[var(--accent)]"
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
