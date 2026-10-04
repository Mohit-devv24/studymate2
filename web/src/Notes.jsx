import { useEffect, useState } from "react";
import "./Notes.css";
import SidebarNav from "./SidebarNav";
import { apiFetch } from "./api";

function Notes() {
  const userId = localStorage.getItem("userId");

  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const loadNotes = async () => {
    try {
      const response = await apiFetch(
        `/api/notes?user_id=${userId}`
      );

      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error(error);
      setMessage("Notes load nahi ho rahe");
    }
  };

  useEffect(() => {
    loadNotes();
  }, [userId]);

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage("Title aur content dono enter karo");
      return;
    }

    try {
      const response = await apiFetch(
        "/api/notes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            user_id: Number(userId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Note add nahi hua");
        return;
      }

      setTitle("");
      setContent("");
      setMessage(data.message || "Note saved successfully");

      loadNotes();
    } catch (error) {
      console.error(error);
      setMessage("Backend se connection nahi ho raha");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiFetch(
        `/api/notes/${id}?user_id=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      setMessage(data.message || "Note deleted");
      loadNotes();
    } catch (error) {
      console.error(error);
      setMessage("Note delete nahi ho raha");
    }
  };

  return (
    <div className="notes-page">
      <SidebarNav />

      <main className="notes-main">
        <header className="notes-header">
          <div>
            <p className="notes-eyebrow">
              STUDY MANAGEMENT
            </p>

            <h1>My Notes</h1>

            <p className="notes-subtitle">
              Keep important ideas, concepts and revision points in one place.
            </p>
          </div>

          <div className="notes-total">
            <span>{notes.length}</span>
            <small>NOTES</small>
          </div>
        </header>

        <section className="note-editor">
          <div className="note-editor-heading">
            <p className="editor-kicker">NEW NOTE</p>

            <h2>Create a note</h2>

            <p>
              Write something you want to remember later.
            </p>
          </div>

          <div className="note-form">
            <input
              type="text"
              placeholder="e.g. Gauss Law — Important Points"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="7"
            />

            <button
              type="button"
              className="note-primary-btn"
              onClick={handleAdd}
            >
              Save note
              <span>→</span>
            </button>
          </div>
        </section>

        <section className="notes-list-section">
          <div className="notes-list-header">
            <div>
              <p className="list-kicker">YOUR LIBRARY</p>

              <h2>Notes</h2>
            </div>

            <span className="notes-count-circle">
              {notes.length}
            </span>
          </div>

          <div className="notes-list">
            {notes.length === 0 ? (
              <div className="notes-empty">
                <div className="empty-icon">📝</div>

                <h3>No notes yet</h3>

                <p>
                  Save your first note above and keep your study
                  material organized.
                </p>
              </div>
            ) : (
              notes.map((item, index) => (
                <article
                  className="note-card"
                  key={item.id}
                >
                  <div className="note-card-left">
                    <span className="note-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="note-icon">
                      📝
                    </div>

                    <div className="note-copy">
                      <h3>{item.title}</h3>
                      <p>{item.content}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="note-delete-btn"
                    onClick={() =>
                      handleDelete(item.id)
                    }
                  >
                    Delete
                  </button>
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
      </main>
    </div>
  );
}

export default Notes;
