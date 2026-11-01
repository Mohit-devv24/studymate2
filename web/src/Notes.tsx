import { useCallback, useEffect, useState } from "react";
import "./Notes.css";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch } from "./api";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/notes");
      if (!response.ok) {
        throw new Error(response.data?.detail || "Unable to load notes.");
      }
      setNotes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to load notes.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      setMessage("Please enter both a title and content for your note.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        // Update existing note
        const response = await apiFetch(`/api/notes/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            title: cleanTitle,
            content: cleanContent,
          }),
        });

        if (!response.ok) {
          throw new Error(response.data?.detail || "Unable to update note.");
        }

        setMessage("Note updated successfully!");
        setEditingId(null);
      } else {
        // Create new note
        const response = await apiFetch("/api/notes", {
          method: "POST",
          body: JSON.stringify({
            title: cleanTitle,
            content: cleanContent,
          }),
        });

        if (!response.ok) {
          throw new Error(response.data?.detail || "Unable to save note.");
        }

        setMessage("Note saved successfully!");
      }

      setTitle("");
      setContent("");
      loadNotes();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to save note. Please check server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiFetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(response.data?.detail || "Unable to delete note.");
      }

      setMessage("Note deleted successfully.");
      if (editingId === id) {
        handleCancelEdit();
      }
      loadNotes();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to delete note.");
    }
  };

  return (
    <div className="notes-page">
      <SidebarNav />

      <main className="notes-main">
        <header className="notes-header">
          <div>
            <p className="notes-eyebrow">STUDY MANAGEMENT</p>
            <h1>My Notes</h1>
            <p className="notes-subtitle">
              Keep important ideas, concepts, and revision points in one organized library.
            </p>
          </div>

          <div className="notes-total">
            <span>{notes.length}</span>
            <small>NOTES</small>
          </div>
        </header>

        <section className="note-editor">
          <div className="note-editor-heading">
            <p className="editor-kicker">
              {editingId ? "EDITING NOTE" : "NEW NOTE"}
            </p>
            <h2>{editingId ? "Update your note" : "Create a note"}</h2>
            <p>
              {editingId
                ? "Modify your note title or content and save the changes."
                : "Capture key lecture takeaways, formula sheets, or study summaries."}
            </p>
          </div>

          <form className="note-form" onSubmit={handleSave}>
            <input
              type="text"
              placeholder="e.g., Engineering Physics — Wave Functions & Schrodinger Equation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />

            <textarea
              placeholder="Write your study notes, explanations, or formula derivations here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              disabled={submitting}
            />

            <div className="note-form-buttons">
              <button
                type="submit"
                className="note-primary-btn"
                disabled={submitting || !title.trim() || !content.trim()}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Update Note"
                  : "Save Note"}
                <span>→</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  className="note-cancel-btn"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="notes-list-section">
          <div className="notes-list-header">
            <div>
              <p className="list-kicker">YOUR LIBRARY</p>
              <h2>Notes ({notes.length})</h2>
            </div>

            <span className="notes-count-circle">{notes.length}</span>
          </div>

          <div className="notes-list">
            {loading ? (
              <div className="notes-empty">
                <p>Loading your study notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="notes-empty">
                <div className="empty-icon">📝</div>
                <h3>No notes yet</h3>
                <p>
                  Save your first note above to build your personal knowledge repository.
                </p>
              </div>
            ) : (
              notes.map((item, index) => (
                <article className="note-card" key={item.id}>
                  <div className="note-card-left">
                    <span className="note-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="note-icon" aria-hidden="true">
                      📝
                    </div>

                    <div className="note-copy">
                      <h3>{item.title}</h3>
                      <p>{item.content}</p>
                    </div>
                  </div>

                  <div className="note-card-actions">
                    <button
                      type="button"
                      className="note-edit-btn"
                      onClick={() => handleStartEdit(item)}
                      aria-label={`Edit ${item.title}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="note-delete-btn"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Delete ${item.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {message && (
          <div className="notes-message" role="status">
            {message}
          </div>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}

export default Notes;
