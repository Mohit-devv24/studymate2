import React, { useEffect, useState } from "react";
import "./Tasks.css";
import SidebarNav from "./SidebarNav";
import { apiFetch } from "./api";

function Tasks() {
  const userId = localStorage.getItem("userId");

  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [message]);

  const loadTasks = async () => {
    try {
      const response = await apiFetch(
        `/api/tasks?user_id=${userId}`
      );

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      setMessage("Tasks load nahi ho rahe");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAdd = async () => {
    if (!task.trim()) {
      setMessage("Please enter a task");
      return;
    }

    try {
      const response = await apiFetch(
        "/api/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: task,
            user_id: Number(userId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Something went wrong");
        return;
      }

      setTask("");
      setMessage(data.message);
      loadTasks();
    } catch (error) {
      console.error(error);
      setMessage("Backend se connection nahi ho raha");
    }
  };

  const handleComplete = async (id) => {
    try {
      const response = await apiFetch(
        `/api/tasks/${id}/complete?user_id=${userId}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();
      setMessage(data.message);
      loadTasks();
    } catch (error) {
      console.error(error);
      setMessage("Task update nahi ho raha");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiFetch(
        `/api/tasks/${id}?user_id=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      setMessage(data.message);
      loadTasks();
    } catch (error) {
      console.error(error);
      setMessage("Task delete nahi ho raha");
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
              Turn your study plans into clear, manageable actions.
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
            <p>Create a simple task and keep moving.</p>
          </div>

          <div className="task-form">
            <input
              type="text"
              placeholder="e.g. Revise matrices"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
            />

            <button className="task-primary-btn" onClick={handleAdd}>
              Add task
              <span>→</span>
            </button>
          </div>
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
              <p className="list-kicker">YOUR LIST</p>
              <h2>Tasks</h2>
            </div>

            <span className="tasks-count-circle">{tasks.length}</span>
          </div>

          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="tasks-empty">
                <div className="empty-icon">✓</div>
                <h3>No tasks yet</h3>
                <p>
                  Add your first task above and keep your study day organized.
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
                        item.completed ? "Mark task pending" : "Mark task complete"
                      }
                    >
                      {item.completed ? "✓" : ""}
                    </button>

                    <div className="task-copy">
                      <strong>{item.title}</strong>
                      <small>
                        {item.completed ? "Completed" : "Pending"}
                      </small>
                    </div>
                  </div>

                  <button
                    className="task-delete-btn"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {message && <div className="tasks-message">{message}</div>}
      </main>
    </div>
  );
}

export default Tasks;
