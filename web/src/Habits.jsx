import { useMemo, useState } from "react";
import SidebarNav from "./SidebarNav";
import "./FeatureSuite.css";

const STORAGE_KEY = "studyMateHabits";

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

function loadHabits() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function calculateStreak(habit) {
  let streak = 0;
  const date = new Date();

  while (true) {
    const key = getDateKey(date);

    if (!habit.completed?.[key]) {
      break;
    }

    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

export default function Habits() {
  const [habits, setHabits] = useState(loadHabits);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const today = getDateKey();

  const saveHabits = (nextHabits) => {
    setHabits(nextHabits);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextHabits)
    );
  };

  const completedToday = useMemo(
    () =>
      habits.filter(
        (habit) => habit.completed?.[today]
      ).length,
    [habits, today]
  );

  const addHabit = () => {
    if (!name.trim()) {
      setMessage("Enter a habit.");
      return;
    }

    const newHabit = {
      id: Date.now(),
      name: name.trim(),
      completed: {},
    };

    saveHabits([...habits, newHabit]);

    setName("");
    setMessage("Habit added.");
  };

  const toggleHabit = (id) => {
    saveHabits(
      habits.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }

        return {
          ...habit,
          completed: {
            ...habit.completed,
            [today]: !habit.completed?.[today],
          },
        };
      })
    );
  };

  const deleteHabit = (id) => {
    saveHabits(
      habits.filter(
        (habit) => habit.id !== id
      )
    );
  };

  return (
    <div className="feature-app-page">
      <SidebarNav />

      <main className="feature-app-main">
        <header className="feature-app-header">
          <div>
            <p className="feature-app-eyebrow">
              CONSISTENCY
            </p>

            <h1>Habits</h1>

            <p className="feature-app-subtitle">
              Build repeatable study habits and record
              whether you showed up today.
            </p>
          </div>

          <div className="feature-app-number">05</div>
        </header>

        <section className="feature-app-grid">
          <div className="feature-app-card">
            <div className="feature-app-stat">
              {habits.length}
            </div>

            <span className="feature-app-stat-label">
              HABITS
            </span>
          </div>

          <div className="feature-app-card">
            <div className="feature-app-stat">
              {completedToday}
            </div>

            <span className="feature-app-stat-label">
              DONE TODAY
            </span>
          </div>

          <div className="feature-app-card">
            <div className="feature-app-stat">
              {habits.length
                ? Math.round(
                    (completedToday /
                      habits.length) *
                      100
                  )
                : 0}
              %
            </div>

            <span className="feature-app-stat-label">
              TODAY'S CONSISTENCY
            </span>
          </div>
        </section>

        <section
          className="feature-app-card"
          style={{ marginTop: 16 }}
        >
          <p className="feature-app-kicker">
            NEW HABIT
          </p>

          <h2>What should you repeat?</h2>

          <div className="feature-app-form">
            <input
              type="text"
              placeholder="e.g. Revise for 30 minutes"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addHabit();
                }
              }}
            />

            <div />
            <div />

            <button
              className="feature-app-button"
              onClick={addHabit}
            >
              Add habit
            </button>
          </div>
        </section>

        <section
          className="feature-app-card"
          style={{ marginTop: 16 }}
        >
          <p className="feature-app-kicker">
            TODAY
          </p>

          <h2>Daily check-in</h2>

          <div className="feature-app-list">
            {!habits.length ? (
              <p>No habits yet.</p>
            ) : (
              habits.map((habit) => {
                const completed =
                  Boolean(habit.completed?.[today]);

                const streak =
                  calculateStreak(habit);

                return (
                  <div
                    className="feature-app-list-item"
                    key={habit.id}
                  >
                    <div className="feature-app-list-copy">
                      <strong>{habit.name}</strong>

                      <span>
                        {completed
                          ? "Completed today"
                          : "Not completed today"}
                      </span>
                    </div>

                    <span className="streak">
                      {streak} DAY STREAK
                    </span>

                    <button
                      className={`habit-check ${
                        completed ? "done" : ""
                      }`}
                      onClick={() =>
                        toggleHabit(habit.id)
                      }
                    >
                      {completed ? "✓" : "○"}
                    </button>

                    <button
                      className="feature-app-button danger"
                      onClick={() =>
                        deleteHabit(habit.id)
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