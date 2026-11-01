"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CalendarDays, Plus, Clock, CheckCircle2, Circle } from "lucide-react";

interface ScheduleBlock {
  id: string;
  day: string;
  time: string;
  subject: string;
  chapter: string;
  completed: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlannerPage() {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([
    {
      id: "1",
      day: "Monday",
      time: "09:00 AM - 10:30 AM",
      subject: "Operating Systems",
      chapter: "Process Scheduling Algorithms",
      completed: true,
    },
    {
      id: "2",
      day: "Monday",
      time: "11:00 AM - 12:30 PM",
      subject: "DBMS",
      chapter: "Normalization & 3NF Forms",
      completed: false,
    },
    {
      id: "3",
      day: "Tuesday",
      time: "02:00 PM - 03:30 PM",
      subject: "Data Structures",
      chapter: "Binary Search Trees & Traversal",
      completed: false,
    },
  ]);

  const [newTime, setNewTime] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newChapter, setNewChapter] = useState("");

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    const newBlock: ScheduleBlock = {
      id: Date.now().toString(),
      day: selectedDay,
      time: newTime.trim() || "10:00 AM - 11:30 AM",
      subject: newSubject.trim(),
      chapter: newChapter.trim() || "General Practice",
      completed: false,
    };

    setBlocks([...blocks, newBlock]);
    setNewTime("");
    setNewSubject("");
    setNewChapter("");
  };

  const handleToggleBlock = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
    );
  };

  const dayBlocks = blocks.filter((b) => b.day === selectedDay);

  return (
    <DashboardLayout
      title="Weekly Study Planner"
      subtitle="Structured schedule blocks to balance your subjects and revisions"
    >
      {/* Day Selector Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const count = blocks.filter((b) => b.day === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]"
              }`}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? "bg-white/20 text-white" : "bg-[var(--surface-3)] text-[var(--ink-muted)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day Schedule List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--ink)]">
              {selectedDay}&apos;s Study Schedule
            </h3>
            <span className="text-xs text-[var(--ink-muted)]">
              {dayBlocks.filter((b) => b.completed).length} of {dayBlocks.length} completed
            </span>
          </div>

          {dayBlocks.length === 0 ? (
            <div className="py-16 text-center bg-[var(--surface)] rounded-3xl border border-[var(--line)] space-y-2">
              <CalendarDays size={32} className="mx-auto text-[var(--ink-muted)]/50" />
              <p className="text-xs text-[var(--ink-muted)]">No study blocks planned for {selectedDay}. Add one below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayBlocks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleToggleBlock(b.id)}
                  className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {b.completed ? (
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={20} className="text-[var(--ink-muted)] shrink-0" />
                    )}
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          b.completed
                            ? "line-through text-[var(--ink-muted)]"
                            : "text-[var(--ink)]"
                        }`}
                      >
                        {b.subject}
                      </h4>
                      <p className="text-xs text-[var(--ink-muted)]">{b.chapter}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[11px] font-semibold text-[var(--ink-secondary)]">
                    <Clock size={12} />
                    <span>{b.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Block Form */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-6 shadow-xs h-fit">
          <h4 className="text-sm font-bold text-[var(--ink)] mb-4">
            Add Block for {selectedDay}
          </h4>

          <form onSubmit={handleAddBlock} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Operating Systems"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
                Chapter / Topic
              </label>
              <input
                type="text"
                value={newChapter}
                onChange={(e) => setNewChapter(e.target.value)}
                placeholder="e.g. Deadlocks"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
                Time Interval
              </label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="e.g. 10:00 AM - 11:30 AM"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add to Planner</span>
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
