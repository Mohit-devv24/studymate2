"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { FileText, Plus, Trash2, Search, Edit3 } from "lucide-react";

interface Note {
  id: number;
  title: string;
  content: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    try {
      const res = await apiFetch("/api/notes");
      if (res.ok) {
        setNotes(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await apiFetch("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        loadNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
      loadNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Study Notes"
      subtitle="Capture lecture summaries, formula sheets, and key concepts"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Note Creator Form */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--line)]">
            <Edit3 size={18} className="text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Create New Note
            </h3>
          </div>

          <form onSubmit={handleCreateNote} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Banker's Algorithm Steps"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your study notes, derivations, or summaries here..."
                rows={6}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Save Note</span>
            </button>
          </form>
        </div>

        {/* Notes Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-[var(--ink-muted)]" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes by keyword..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[var(--ink-muted)]">Loading notes...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center bg-[var(--surface)] rounded-2xl border border-[var(--line)] space-y-2">
              <FileText size={32} className="mx-auto text-[var(--ink-muted)]/50" />
              <p className="text-xs text-[var(--ink-muted)]">No notes found. Create your first note on the left.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((note) => (
                <div
                  key={note.id}
                  className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-[var(--ink)] truncate">
                        {note.title}
                      </h4>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors p-1 cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--ink-secondary)] whitespace-pre-wrap line-clamp-4 leading-relaxed font-sans">
                      {note.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
