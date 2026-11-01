import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Subjects.css";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch } from "./api";


function Subjects() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const loadSubjects = useCallback(async () => {
    try {
      const response = await apiFetch("/api/subjects");

      if (!response.ok) {
        throw new Error(response.data?.detail || "Failed to load subjects");
      }

      const data = response.data;
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to load subjects.");
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    loadSubjects();
  }, [userId, navigate, loadSubjects]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [message]);

  const handleAddSubject = async () => {
    const cleanName = subject.trim();

    if (!cleanName) {
      setMessage("Please enter a subject name.");
      return;
    }

    try {
      const response = await apiFetch("/api/subjects", {
        method: "POST",
        body: JSON.stringify({ name: cleanName }),
      });

      const data = response.data;

      if (!response.ok) {
        setMessage(data?.detail || "Failed to add subject.");
        return;
      }

      setSubject("");
      setMessage(data?.message || "Subject added successfully!");
      await loadSubjects();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to connect to the server.");
    }
  };

  const handleEditSubject = (item) => {
    setSubject(item.name);
    setEditingId(item.id);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateSubject = async () => {
    const cleanName = subject.trim();

    if (!cleanName) {
      setMessage("Please enter a subject name.");
      return;
    }

    try {
      const response = await apiFetch(`/api/subjects/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({ name: cleanName }),
      });

      const data = response.data;

      if (!response.ok) {
        setMessage(data?.detail || "Unable to update subject.");
        return;
      }

      setSubject("");
      setEditingId(null);
      setMessage(data?.message || "Subject updated successfully!");
      await loadSubjects();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to update subject.");
    }
  };

  const handleCancelEdit = () => {
    setSubject("");
    setEditingId(null);
    setMessage("");
  };

  const handleDeleteSubject = async (id) => {
    try {
      const response = await apiFetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      const data = response.data;

      if (!response.ok) {
        setMessage(data?.detail || "Unable to delete subject.");
        return;
      }

      if (editingId === id) {
        handleCancelEdit();
      }

      setMessage(data?.message || "Subject deleted successfully.");
      await loadSubjects();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to delete subject.");
    }
  };

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = subjects.filter((item) =>
      item.name.toLowerCase().includes(term)
    );

    if (sortBy === "az") {
      return [...filtered].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    if (sortBy === "za") {
      return [...filtered].sort((a, b) =>
        b.name.localeCompare(a.name)
      );
    }

    return [...filtered].sort((a, b) => b.id - a.id);
  }, [subjects, search, sortBy]);

  const scrollToEditor = () => {
    document
      .querySelector(".subject-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      (document.querySelector(".subject-form input") as HTMLInputElement | null)?.focus();
    }, 350);
  };

  
   return (
  <div className="subjects-page">
    <SidebarNav />

    <main className="subjects-main">
        <header className="subjects-header">
          <div>
            <p className="subjects-eyebrow">STUDY MANAGEMENT</p>
            <h1>My Subjects</h1>
            <p className="subjects-subtitle">
              Keep your study subjects organized and easy to manage.
            </p>
          </div>

          <div className="subjects-total">
            <span>{subjects.length}</span>
            <small>SUBJECTS</small>
          </div>
        </header>

        <section className="subjects-toolbar">
          <div className="subjects-search-wrap">
            <span className="subjects-search-icon">⌕</span>
            <input
              type="search"
              placeholder="Search your subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search subjects"
            />
            {search && (
              <button
                className="subjects-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort subjects"
          >
            <option value="newest">Newest first</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </section>

        <section className="subject-editor">
          <p className="editor-kicker">
            {editingId ? "EDIT SUBJECT" : "NEW SUBJECT"}
          </p>

          <div className="editor-heading">
            <h2>{editingId ? "Update your subject" : "Add a subject"}</h2>
            <p>
              {editingId
                ? "Make the change and keep your study space tidy."
                : "Add a subject to your personal study space."}
            </p>
          </div>

          <div className="subject-form">
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (editingId) {
                    handleUpdateSubject();
                  } else {
                    handleAddSubject();
                  }
                }
              }}
            />

            {editingId ? (
              <>
                <button
                  className="subject-primary-btn"
                  onClick={handleUpdateSubject}
                >
                  Update
                </button>
                <button
                  className="subject-cancel-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="subject-primary-btn"
                onClick={handleAddSubject}
              >
                Add subject
              </button>
            )}
          </div>
        </section>

        <section className="subjects-list-section">
          <div className="list-section-header">
            <div>
              <p className="list-kicker">
                {search ? "SEARCH RESULTS" : "YOUR LIBRARY"}
              </p>
              <h2>
                {search
                  ? `${filteredSubjects.length} matching subject${filteredSubjects.length === 1 ? "" : "s"}`
                  : "Your subjects"}
              </h2>
            </div>

            <span className="list-count">{filteredSubjects.length}</span>
          </div>

          {filteredSubjects.length > 0 ? (
            <div className="subjects-card-grid">
              {filteredSubjects.map((item, index) => (
                <article className="subject-card" key={item.id}>
                  <div className="subject-card-top">
                    <span className="subject-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="subject-card-index">SUBJECT</span>
                  </div>

                  <div className="subject-card-middle">
                    <div className="subject-letter">
                      {item.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="subject-info">
                      <h3>{item.name}</h3>
                      <p>Part of your personal study space.</p>
                    </div>
                  </div>

                  <div className="subject-card-bottom">
                    <span>Keep learning. Keep moving.</span>
                    <div className="subject-actions">
                      <button
                        className="subject-edit-btn"
                        onClick={() => handleEditSubject(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="subject-delete-btn"
                        onClick={() => handleDeleteSubject(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : subjects.length > 0 && search ? (
            <div className="subjects-no-results">
              <div className="no-results-mark">⌕</div>
              <h3>No matching subjects</h3>
              <p>Try another name or clear the search.</p>
              <button onClick={() => setSearch("")}>Clear search</button>
            </div>
          ) : (
            <div className="subjects-empty">
              <div className="empty-icon">+</div>
              <p className="empty-kicker">START HERE</p>
              <h3>Your study space is waiting.</h3>
              <p>
                Add your first subject and turn this space into your personal
                study hub.
              </p>
              <button onClick={scrollToEditor}>Add your first subject</button>
            </div>
          )}
        </section>

        <section className="subjects-quote">
          <span>STUDYMATE / NOTE TO SELF</span>
          <h2>
            “Consistency makes ordinary study days <em>matter.</em>”
          </h2>
          <p>
            Build your space one subject at a time. Then take the next small
            step.
          </p>
        </section>

        {message && (
          <div className="subjects-message" role="status">
            <span>•</span>
            {message}
          </div>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}

export default Subjects;
