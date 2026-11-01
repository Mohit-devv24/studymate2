import { useCallback, useEffect, useState } from "react";
import "./Tasks.css";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch } from "./api";
import confetti from "canvas-confetti";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
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

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/tasks");
      if (!response.ok) {
        throw new Error(response.data?.detail || "Unable to load tasks.");
      }
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to load tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async (e) => {
    if (e) e.preventDefault();
    const cleanTitle = task.trim();
    if (!cleanTitle) {
      setMessage("Please enter a task title.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: cleanTitle }),
      });

      if (!response.ok) {
        throw new Error(response.data?.detail || "Unable to add task.");
      }

      setTask("");
      setMessage("Task added successfully!");
      loadTasks();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to add task. Please check server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleSaveEdit = async (id) => {
    const cleanTitle = editingTitle.trim();
    if (!cleanTitle) {
      setMessage("Task title cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiFetch(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title: cleanTitle }),
      });

      if (!response.ok) {
        throw new Error(response.data?.detail || "Unable to update task.");
      }

      setEditingId(null);
      setEditingTitle("");
      setMessage("Task updated successfully!");
      loadTasks();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to update task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      const response = await apiFetch(`/api/tasks/${id}/complete`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error(response.data?.detail || "Unable to update status.");
      }

      const xp = response.data?.xp_gained;
      if (xp && xp > 0) {
        setMessage(`Task completed! +${xp} XP gained! ✦`);
        try {
          confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
        } catch {}
      } else {
        setMessage("Task status updated.");
      }
      loadTasks();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to update task status.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiFetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(response.data?.detail || "Unable to delete task.");
      }

      setMessage("Task deleted successfully.");
      loadTasks();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to delete task.");
    }
  };

  const completedCount = tasks.filter((item) => item.completed).length;
  const pendingCount = tasks.length - completedCount;
  const progress =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="tasks-page">
      <SidebarNav />

      <main className="tasks-main">
        <header className="tasks-header">
          <div>
            <p className="tasks-eyebrow">STUDY MANAGEMENT</p>
            <h1>My Tasks</h1>
            <p className="tasks-subtitle">
              Turn your study goals into clear, actionable steps.
            </p>
          </div>

          <div className="tasks-total">
            <span>{tasks.length}</span>
            <small>TASKS</small>
          </div>
        </header>

        <section className="task-editor">
          <div className="task-editor-heading">
            <p className="editor-kicker">NEW TASK</p>
            <h2>Add a task</h2>
            <p>Create a task to keep your study sessions focused.</p>
          </div>

          <form className="task-form" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="e.g., Complete Mathematics Assignment 3"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={submitting}
            />

            <button
              type="submit"
              className="task-primary-btn"
              disabled={submitting || !task.trim()}
            >
              {submitting ? "Adding..." : "Add Task"}
              <span>→</span>
            </button>
          </form>
        </section>

        <section className="task-overview">
          <div className="overview-card">
            <span className="overview-label">TOTAL</span>
            <strong>{tasks.length}</strong>
          </div>

          <div className="overview-card">
            <span className="overview-label">PENDING</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="overview-card">
            <span className="overview-label">DONE</span>
            <strong>{completedCount}</strong>
          </div>

          <div className="overview-card overview-progress">
            <div className="overview-progress-top">
              <span className="overview-label">PROGRESS</span>
              <strong>{progress}%</strong>
            </div>
            <div className="task-progress-track">
              <div
                className="task-progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </section>

        <section className="tasks-list-section">
          <div className="tasks-list-header">
            <div>
              <p className="list-kicker">YOUR ACTION LIST</p>
              <h2>Tasks ({tasks.length})</h2>
            </div>

            <span className="tasks-count-circle">{completedCount}/{tasks.length}</span>
          </div>

          <div className="tasks-list">
            {loading ? (
              <div className="tasks-empty">
                <p>Loading your study tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="tasks-empty">
                <div className="empty-icon">✓</div>
                <h3>No tasks yet</h3>
                <p>
                  Add your first task above and start building your study momentum.
                </p>
              </div>
            ) : (
              tasks.map((item, index) => (
                <div
                  className={`task-item ${
                    item.completed ? "task-item-completed" : ""
                  }`}
                  key={item.id}
                >
                  <div className="task-item-left">
                    <span className="task-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <button
                      className={`task-check ${
                        item.completed ? "completed" : ""
                      }`}
                      onClick={() => handleComplete(item.id)}
                      aria-label={
                        item.completed
                          ? "Mark task pending"
                          : "Mark task complete"
                      }
                      title={
                        item.completed ? "Mark pending" : "Mark completed (+10 XP)"
                      }
                    >
                      {item.completed ? "✓" : ""}
                    </button>

                    <div className="task-copy">
                      {editingId === item.id ? (
                        <div className="task-edit-inline">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(item.id);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <div className="task-inline-actions">
                            <button
                              type="button"
                              className="task-save-btn"
                              onClick={() => handleSaveEdit(item.id)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="task-cancel-btn"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <strong>{item.title}</strong>
                          <small>
                            {item.completed ? "Completed (+10 XP)" : "Pending"}
                          </small>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="task-item-actions">
                    {editingId !== item.id && (
                      <button
                        type="button"
                        className="task-edit-btn"
                        onClick={() => handleStartEdit(item)}
                        aria-label={`Edit ${item.title}`}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="task-delete-btn"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Delete ${item.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {message && (
          <div className="tasks-message" role="status">
            {message}
          </div>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}

export default Tasks;
