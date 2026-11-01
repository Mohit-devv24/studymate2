"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

interface Task {
  id: number;
  title: string;
  completed: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const res = await apiFetch("/api/tasks");
      if (res.ok) {
        setTasks(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: newTaskTitle.trim() }),
      });
      if (res.ok) {
        setNewTaskTitle("");
        loadTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (id: number) => {
    try {
      await apiFetch(`/api/tasks/${id}/complete`, { method: "POST" });
      loadTasks();
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: t.completed ? 0 : 1 } : t))
      );
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return Boolean(t.completed);
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <DashboardLayout
      title="Study Tasks"
      subtitle="Organize, track, and earn XP for your daily academic tasks"
    >
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] self-start">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "active"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Active ({tasks.length - completedCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "completed"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new study task (e.g. Solve 10 OS numericals)..."
            className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--line)] p-6 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--ink-muted)]">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--ink-muted)] space-y-2">
            <CheckSquare size={32} className="mx-auto text-[var(--ink-muted)]/50" />
            <p>No tasks found in this view.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-[var(--line)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <div
                  onClick={() => handleToggleTask(task.id)}
                  className="flex items-center gap-3.5 flex-1 cursor-pointer"
                >
                  {task.completed ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Circle size={18} className="text-[var(--ink-muted)] shrink-0 group-hover:text-[var(--accent)]" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      task.completed
                        ? "line-through text-[var(--ink-muted)]"
                        : "text-[var(--ink)]"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {task.completed ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      +10 XP
                    </span>
                  ) : null}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
