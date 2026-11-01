import { useCallback, useEffect, useMemo, useState } from "react";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import "./FeatureSuite.css";
import { apiFetch } from "./api";

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadStorage(key) {
  try {
    return JSON.parse(
      localStorage.getItem(key) || "[]"
    );
  } catch {
    return [];
  }
}

export default function Analytics() {
  const userId = localStorage.getItem("userId") || "guest";

  const getScopedStorage = useCallback((baseKey) => {
    return (
      loadStorage(`${baseKey}_${userId}`) ||
      loadStorage(baseKey) ||
      []
    );
  }, [userId]);

  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState(() => getScopedStorage("studyMateGoals"));
  const [habits, setHabits] = useState(() => getScopedStorage("studyMateHabits"));
  const [timerHistory, setTimerHistory] = useState(() =>
    getScopedStorage("studyMateTimerHistory")
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const response = await apiFetch("/api/tasks");

        if (!response.ok) {
          throw new Error(
            response.data?.detail || "Failed to load tasks"
          );
        }

        if (!cancelled) {
          setTasks(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (error) {
        console.error("Analytics tasks error:", error);
        if (!cancelled) {
          setTasks([]);
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const refresh = () => {
      setGoals(getScopedStorage("studyMateGoals"));
      setHabits(getScopedStorage("studyMateHabits"));
      setTimerHistory(getScopedStorage("studyMateTimerHistory"));
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [getScopedStorage]);

  const completedTasks = tasks.filter(
    (task) => Boolean(task.completed)
  ).length;

  const taskCompletion = tasks.length
    ? Math.round(
        (completedTasks / tasks.length) * 100
      )
    : 0;

  const goalProgress = goals.length
    ? Math.round(
        (goals.reduce((sum, goal) => {
          return (
            sum +
            Math.min(
              goal.progress / goal.target,
              1
            )
          );
        }, 0) /
          goals.length) *
          100
      )
    : 0;

  const totalFocusMinutes = Math.round(
    timerHistory.reduce(
      (sum, session) =>
        sum + Number(session.minutes || 0),
      0
    )
  );

  const today = getDateKey();

  const habitConsistency = habits.length
    ? Math.round(
        (habits.filter(
          (habit) =>
            Boolean(habit.completed?.[today])
        ).length /
          habits.length) *
          100
      )
    : 0;

  const weeklyFocus = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();

      date.setDate(
        date.getDate() - (6 - index)
      );

      const key = getDateKey(date);

      const minutes = timerHistory
        .filter(
          (session) => session.date === key
        )
        .reduce(
          (sum, session) =>
            sum +
            Number(session.minutes || 0),
          0
        );

      return {
        key,
        label: date.toLocaleDateString(
          "en-IN",
          { weekday: "short" }
        ),
        minutes,
      };
    });
  }, [timerHistory]);

  const maxFocus = Math.max(
    1,
    ...weeklyFocus.map(
      (item) => item.minutes
    )
  );

  return (
    <div className="feature-app-page">
      <SidebarNav />

      <main className="feature-app-main">
        <header className="feature-app-header">
          <div>
            <p className="feature-app-eyebrow">
              STUDY INSIGHTS
            </p>

            <h1>Analytics</h1>

            <p className="feature-app-subtitle">
              Turn your tasks, goals, habits and focus
              sessions into useful study insights.
            </p>
          </div>

          <div className="feature-app-number">
            04
          </div>
        </header>

        <section className="feature-app-grid">
          <div className="feature-app-card">
            <div className="feature-app-stat">
              {completedTasks}/{tasks.length}
            </div>

            <span className="feature-app-stat-label">
              TASKS COMPLETED
            </span>
          </div>

          <div className="feature-app-card">
            <div className="feature-app-stat">
              {goalProgress}%
            </div>

            <span className="feature-app-stat-label">
              GOAL PROGRESS
            </span>
          </div>

          <div className="feature-app-card">
            <div className="feature-app-stat">
              {totalFocusMinutes}m
            </div>

            <span className="feature-app-stat-label">
              FOCUS LOGGED
            </span>
          </div>
        </section>

        <section
          className="feature-app-grid"
          style={{ marginTop: 16 }}
        >
          <div
            className="feature-app-card"
            style={{ gridColumn: "span 2" }}
          >
            <p className="feature-app-kicker">
              LAST 7 DAYS
            </p>

            <h2>Focus time</h2>

            <div className="analytics-chart">
              {weeklyFocus.map((item) => {
                const height = Math.max(
                  8,
                  (item.minutes /
                    maxFocus) *
                    125
                );

                return (
                  <div
                    className="analytics-bar"
                    key={item.key}
                    style={{
                      height: `${height}px`,
                    }}
                  >
                    <em>
                      {item.minutes}m
                    </em>

                    <span>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="feature-app-card">
            <p className="feature-app-kicker">
              TODAY
            </p>

            <div className="feature-app-stat">
              {habitConsistency}%
            </div>

            <p>
              Habit consistency today.
            </p>

            <div className="feature-app-progress">
              <span
                style={{
                  width: `${habitConsistency}%`,
                }}
              />
            </div>

            <p style={{ marginTop: 18 }}>
              Task completion:{" "}
              <strong>
                {taskCompletion}%
              </strong>
            </p>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}