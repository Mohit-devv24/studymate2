import { useMemo, useState } from "react";
import SidebarNav from "./SidebarNav";
import "./FeatureSuite.css";

const STORAGE_KEY = "studyMateGoals";

function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Goals() {
  const [goals, setGoals] = useState(loadGoals);

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(10);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const saveGoals = (nextGoals) => {
    setGoals(nextGoals);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextGoals)
    );
  };

  const completedGoals = useMemo(
    () =>
      goals.filter(
        (goal) => goal.progress >= goal.target
      ).length,
    [goals]
  );

  const averageProgress = useMemo(() => {
    if (!goals.length) return 0;

    const total = goals.reduce((sum, goal) => {
      return (
        sum +
        Math.min(
          goal.progress / goal.target,
          1
        )
      );
    }, 0);

    return Math.round(
      (total / goals.length) * 100
    );
  }, [goals]);

  const addGoal = () => {
    if (!title.trim()) {
      setMessage("Enter a goal.");
      return;
    }

    const goalTarget = Math.max(
      1,
      Number(target) || 1
    );

    const goalProgress = Math.min(
      goalTarget,
      Math.max(0, Number(progress) || 0)
    );

    const newGoal = {
      id: Date.now(),
      title: title.trim(),
      target: goalTarget,
      progress: goalProgress,
    };

    saveGoals([...goals, newGoal]);

    setTitle("");
    setProgress(0);
    setMessage("Goal created.");
  };

  const updateProgress = (id, value) => {
    saveGoals(
      goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              progress: Number(value),
            }
          : goal
      )
    );
  };

  const deleteGoal = (id) => {
    saveGoals(
      goals.filter((goal) => goal.id !== id)
    );
  };

  return (
    <div className="feature-app-page">
      <SidebarNav />

      <main className="feature-app-main">
        <header className="feature-app-header">
          <div>
            <p className="feature-app-eyebrow">
              STUDY DIRECTION
            </p>

            <h1>Goals</h1>

            <p className="feature-app-subtitle">
              Turn intentions into measurable targets
              and keep your next milestone visible.
            </p>
          </div>

          <div className="feature-app-number">03</div>
        </header>

        <section className="feature-app-grid">
          <div className="feature-app-card">
            <div className="feature-app-stat">
              {goals.length}
            </div>

            <span className="feature-app-stat-label">
              TOTAL GOALS
            </span>
          </div>

          <div className="feature-app-card">
            <div className="feature-app-stat">
              {completedGoals}
            </div>

            <span className="feature-app-stat-label">
              COMPLETED
            </span>
          </div>

          <div className="feature-app-card">
            <div className="feature-app-stat">
              {averageProgress}%
            </div>

            <span className="feature-app-stat-label">
              AVERAGE PROGRESS
            </span>
          </div>
        </section>

        <section
          className="feature-app-card"
          style={{ marginTop: 16 }}
        >
          <p className="feature-app-kicker">
            NEW GOAL
          </p>

          <h2>Create a measurable target</h2>

          <div className="feature-app-form">
            <input
              type="text"
              placeholder="e.g. Finish 10 Maths chapters"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />

            <input
              type="number"
              min="1"
              placeholder="Target"
              value={target}
              onChange={(event) =>
                setTarget(event.target.value)
              }
            />

            <input
              type="number"
              min="0"
              placeholder="Progress"
              value={progress}
              onChange={(event) =>
                setProgress(event.target.value)
              }
            />

            <button
              className="feature-app-button"
              onClick={addGoal}
            >
              Add goal
            </button>
          </div>
        </section>

        <section
          className="feature-app-card"
          style={{ marginTop: 16 }}
        >
          <p className="feature-app-kicker">
            YOUR TARGETS
          </p>

          <h2>Progress</h2>

          <div className="feature-app-list">
            {!goals.length ? (
              <p>No goals yet.</p>
            ) : (
              goals.map((goal) => {
                const percentage = Math.round(
                  Math.min(
                    goal.progress / goal.target,
                    1
                  ) * 100
                );

                return (
                  <div
                    className="feature-app-list-item"
                    key={goal.id}
                  >
                    <div className="feature-app-list-copy">
                      <div className="goal-head">
                        <strong>{goal.title}</strong>

                        <span className="goal-percent">
                          {percentage}%
                        </span>
                      </div>

                      <span>
                        {goal.progress} / {goal.target}
                      </span>

                      <div className="feature-app-progress">
                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <input
                        type="range"
                        min="0"
                        max={goal.target}
                        value={goal.progress}
                        onChange={(event) =>
                          updateProgress(
                            goal.id,
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      className="feature-app-button danger"
                      onClick={() =>
                        deleteGoal(goal.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {message && (
          <div className="feature-app-message">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}