"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { BookOpen, Plus, Trash2, BrainCircuit, Search } from "lucide-react";
import Link from "next/link";

interface Subject {
  id: number;
  name: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSubjects = async () => {
    try {
      const res = await apiFetch("/api/subjects");
      if (res.ok) {
        setSubjects(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const res = await apiFetch("/api/subjects", {
        method: "POST",
        body: JSON.stringify({ name: newSubjectName.trim() }),
      });
      if (res.ok) {
        setNewSubjectName("");
        loadSubjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to remove this subject?")) return;
    try {
      await apiFetch(`/api/subjects/${id}`, { method: "DELETE" });
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Subjects"
      subtitle="Organize your curriculum and generate tailored chapter tests"
    >
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-[var(--ink-muted)]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
          />
        </div>

        <form onSubmit={handleAddSubject} className="flex gap-2">
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="New subject name..."
            className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Subject</span>
          </button>
        </form>
      </div>

      {/* Grid of Subjects */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--ink-muted)]">Loading subjects...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-3xl border border-[var(--line)] space-y-3">
          <BookOpen size={36} className="mx-auto text-[var(--ink-muted)]" />
          <h3 className="text-sm font-bold text-[var(--ink)]">No Subjects Found</h3>
          <p className="text-xs text-[var(--ink-muted)] max-w-sm mx-auto">
            {search ? "No subjects match your query." : "Add your course subjects to generate tailored tests."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0 font-bold">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)]">
                      {s.name}
                    </h3>
                    <p className="text-[11px] text-[var(--ink-muted)]">Curriculum Course</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSubject(s.id)}
                  className="p-1 text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                  title="Remove subject"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
                <Link
                  href={`/tests`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] bg-[var(--accent-light)] hover:bg-[var(--accent)]/20 transition-colors"
                >
                  <BrainCircuit size={13} />
                  <span>Generate Test</span>
                </Link>
                <Link
                  href={`/notes`}
                  className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  View Notes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
