import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import "./GamifiedLearning.css";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch } from "./api";
import confetti from "canvas-confetti";

function Dashboard() {
  const userName = localStorage.getItem("userName") || "Student";

  // Data states
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [quickTask, setQuickTask] = useState("");
  const [quickSubject, setQuickSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Gamification & Study goal
  const [profile, setProfile] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [badges, setBadges] = useState([]);
  const [studyGoal, setStudyGoal] = useState(null);
  const [challengeFilter, setChallengeFilter] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(
    localStorage.getItem("userCourse") || "JEE (Main & Advanced)"
  );

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardStanding, setLeaderboardStanding] = useState(null);
  const [leaderboardCourseFilter, setLeaderboardCourseFilter] = useState("All");

  // Quiz modal
  const [activeQuizChallenge, setActiveQuizChallenge] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [dailySetDate, setDailySetDate] = useState("");
  const [generatingChallenges, setGeneratingChallenges] = useState(false);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState("");
  const [quizIsCorrect, setQuizIsCorrect] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState("");

  // Mini Focus Timer
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusSessionId, setFocusSessionId] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(25 * 60);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  // Load core dashboard data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const userCourse = localStorage.getItem("userCourse") || "JEE (Main & Advanced)";
      const [subsRes, tasksRes, profRes, chalRes, badgeRes, goalRes, leadRes] =
        await Promise.all([
          apiFetch("/api/subjects"),
          apiFetch("/api/tasks"),
          apiFetch("/api/gamification/profile"),
          apiFetch(`/api/gamification/daily-challenges?course=${encodeURIComponent(userCourse)}`),
          apiFetch("/api/gamification/badges"),
          apiFetch("/api/study/goal"),
          apiFetch("/api/leaderboard"),
        ]);

      if (subsRes.ok && Array.isArray(subsRes.data)) {
        setSubjects(subsRes.data);
      }
      if (tasksRes.ok && Array.isArray(tasksRes.data)) {
        setTasks(tasksRes.data);
      }
      if (profRes.ok && profRes.data) {
        setProfile(profRes.data);
      }
      if (chalRes.ok) {
        if (chalRes.data?.challenges && Array.isArray(chalRes.data.challenges)) {
          setChallenges(chalRes.data.challenges);
          if (chalRes.data.generation_date) setDailySetDate(chalRes.data.generation_date);
        } else if (Array.isArray(chalRes.data)) {
          setChallenges(chalRes.data);
        }
      }
      if (badgeRes.ok && Array.isArray(badgeRes.data)) {
        setBadges(badgeRes.data);
      }
      if (goalRes.ok && goalRes.data) {
        setStudyGoal(goalRes.data);
      }
      if (leadRes.ok && leadRes.data) {
        setLeaderboard(leadRes.data.leaderboard || []);
        setLeaderboardStanding(leadRes.data.user_standing || null);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
      setMessage("Unable to load all dashboard data. Please verify backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick Task Creation
  const handleAddQuickTask = async (e) => {
    if (e) e.preventDefault();
    const cleanTitle = quickTask.trim();
    if (!cleanTitle) return;

    try {
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: cleanTitle }),
      });
      if (res.ok) {
        setQuickTask("");
        setMessage("Task added to your list!");
        const tasksRes = await apiFetch("/api/tasks");
        if (tasksRes.ok) setTasks(tasksRes.data);
      } else {
        setMessage(res.data?.detail || "Unable to add task.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
  };

  // Quick Subject Creation
  const handleAddQuickSubject = async (e) => {
    if (e) e.preventDefault();
    const cleanName = quickSubject.trim();
    if (!cleanName) return;

    try {
      const res = await apiFetch("/api/subjects", {
        method: "POST",
        body: JSON.stringify({ name: cleanName }),
      });
      if (res.ok) {
        setQuickSubject("");
        setMessage("Subject added successfully!");
        const subsRes = await apiFetch("/api/subjects");
        if (subsRes.ok) setSubjects(subsRes.data);
      } else {
        setMessage(res.data?.detail || "Unable to add subject.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (id) => {
    try {
      const res = await apiFetch(`/api/tasks/${id}/complete`, {
        method: "PUT",
      });
      if (res.ok) {
        const xp = res.data?.xp_gained;
        if (xp) {
          setMessage(`Task completed! +${xp} XP gained! ✦`);
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
          } catch {}
        } else {
          setMessage("Task status updated.");
        }
        // Refresh tasks and gamification profile
        const [tasksRes, profRes, badgeRes] = await Promise.all([
          apiFetch("/api/tasks"),
          apiFetch("/api/gamification/profile"),
          apiFetch("/api/gamification/badges"),
        ]);
        if (tasksRes.ok) setTasks(tasksRes.data);
        if (profRes.ok) setProfile(profRes.data);
        if (badgeRes.ok) setBadges(badgeRes.data);
      }
    } catch {
      setMessage("Unable to update task status.");
    }
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    try {
      const res = await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setMessage("Task removed.");
      }
    } catch {
      setMessage("Unable to delete task.");
    }
  };

  // Finish Focus Session
  const handleFinishSession = useCallback(async () => {
    setTimerRunning(false);
    const completedSeconds = Math.max(0, sessionDuration - (minutes * 60 + seconds));

    if (completedSeconds >= 10) {
      try {
        const id = focusSessionId || 0;
        const res = await apiFetch(`/api/study/focus/${id}/finish`, {
          method: "POST",
          body: JSON.stringify({ duration_seconds: completedSeconds }),
        });

        if (res.ok) {
          const xp = res.data?.xp_awarded || 0;
          const creditedMinutes = Math.floor(completedSeconds / 60);
          setMessage(
            creditedMinutes > 0
              ? `Great work! Focused for ${creditedMinutes} min (+${xp} XP)!`
              : `Logged ${completedSeconds}s focused session.`
          );
          // Refresh profile & goal
          const [profRes, goalRes] = await Promise.all([
            apiFetch("/api/gamification/profile"),
            apiFetch("/api/study/goal"),
          ]);
          if (profRes.ok) setProfile(profRes.data);
          if (goalRes.ok) setStudyGoal(goalRes.data);
        }
      } catch (e) {
        console.error("Focus finish error:", e);
      }
    }

    setFocusSessionId(null);
  }, [focusSessionId, sessionDuration, minutes, seconds]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!timerRunning) return;

    const timer = setInterval(() => {
      setSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;

        setMinutes((prevMin) => {
          if (prevMin <= 0) {
            setTimerRunning(false);
            handleFinishSession();
            return 0;
          }
          return prevMin - 1;
        });

        return 59;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning, handleFinishSession]);

  // Start Focus Session
  const handleStartTimer = async () => {
    try {
      if (!focusSessionId) {
        const res = await apiFetch("/api/study/focus/start", { method: "POST" });
        if (res.ok && res.data?.session_id) {
          setFocusSessionId(res.data.session_id);
        }
      }
      setTimerRunning(true);
    } catch {
      setTimerRunning(true);
    }
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setMinutes(25);
    setSeconds(0);
    setSessionDuration(25 * 60);
    setFocusSessionId(null);
  };

  const setTimerPreset = (mins) => {
    setTimerRunning(false);
    setMinutes(mins);
    setSeconds(0);
    setSessionDuration(mins * 60);
    setFocusSessionId(null);
  };

  // Quiz Modal Handlers
  const handleCourseChange = async (newCourse: string) => {
    setSelectedCourse(newCourse);
    localStorage.setItem("userCourse", newCourse);
    try {
      if (newCourse !== "All Courses") {
        await apiFetch("/api/user/course", {
          method: "POST",
          body: JSON.stringify({ course: newCourse }),
        });
      }
      const chalRes = await apiFetch(
        `/api/gamification/daily-challenges${newCourse === "All Courses" ? "?course=all" : `?course=${encodeURIComponent(newCourse)}`}`
      );
      if (chalRes.ok) {
        if (chalRes.data?.challenges && Array.isArray(chalRes.data.challenges)) {
          setChallenges(chalRes.data.challenges);
          if (chalRes.data.generation_date) setDailySetDate(chalRes.data.generation_date);
        } else if (Array.isArray(chalRes.data)) {
          setChallenges(chalRes.data);
        }
      }
    } catch (e) {
      console.error("Failed to switch course", e);
    }
  };

  const handleOpenQuiz = (challenge) => {
    if (challenge.completed) return;
    setActiveQuizChallenge(challenge);
    setSelectedAnswer("");
    setQuizFeedback("");
    setQuizExplanation("");
    setQuizCorrectAnswer("");
    setQuizIsCorrect(null);
  };

  const handleCloseQuiz = () => {
    setActiveQuizChallenge(null);
    setSelectedAnswer("");
    setQuizFeedback("");
    setQuizExplanation("");
    setQuizCorrectAnswer("");
    setQuizIsCorrect(null);
  };

  const handleRegenerateChallenges = async () => {
    try {
      setGeneratingChallenges(true);
      setMessage("Groq AI is generating a fresh curriculum challenge set...");
      const res = await apiFetch("/api/gamification/daily-challenges/generate", {
        method: "POST",
        body: JSON.stringify({
          course: selectedCourse === "All Courses" ? undefined : selectedCourse,
          force_refresh: true,
        }),
      });
      if (res.ok) {
        setMessage("✨ Fresh AI Daily Challenges generated!");
        const userCourse = selectedCourse === "All Courses" ? "all" : selectedCourse;
        const chalRes = await apiFetch(
          `/api/gamification/daily-challenges?course=${encodeURIComponent(userCourse)}`
        );
        if (chalRes.ok) {
          if (chalRes.data?.challenges && Array.isArray(chalRes.data.challenges)) {
            setChallenges(chalRes.data.challenges);
            if (chalRes.data.generation_date) setDailySetDate(chalRes.data.generation_date);
          } else if (Array.isArray(chalRes.data)) {
            setChallenges(chalRes.data);
          }
        }
      } else {
        setMessage(res.data?.detail || "Failed to generate new challenges.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Failed to regenerate challenges. Please check connection.");
    } finally {
      setGeneratingChallenges(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedAnswer || !activeQuizChallenge) return;
    try {
      setQuizSubmitting(true);
      setQuizFeedback("");
      const res = await apiFetch(
        `/api/gamification/daily-challenges/${activeQuizChallenge.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ selected_answer: selectedAnswer }),
        }
      );

      if (res.ok) {
        setQuizIsCorrect(true);
        if (res.data?.explanation) {
          setQuizExplanation(res.data.explanation);
        }
        if (res.data?.correct_answer) {
          setQuizCorrectAnswer(res.data.correct_answer);
        }
        setMessage(`Challenge completed! +${activeQuizChallenge.xp_reward} XP! ✦`);
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
        // Refresh challenges and profile
        const userCourse = selectedCourse === "All Courses" ? "all" : selectedCourse;
        const [chalRes, profRes, badgeRes] = await Promise.all([
          apiFetch(`/api/gamification/daily-challenges?course=${encodeURIComponent(userCourse)}`),
          apiFetch("/api/gamification/profile"),
          apiFetch("/api/gamification/badges"),
        ]);
        if (chalRes.ok) {
          if (chalRes.data?.challenges && Array.isArray(chalRes.data.challenges)) {
            setChallenges(chalRes.data.challenges);
            if (chalRes.data.generation_date) setDailySetDate(chalRes.data.generation_date);
          } else if (Array.isArray(chalRes.data)) {
            setChallenges(chalRes.data);
          }
        }
        if (profRes.ok) setProfile(profRes.data);
        if (badgeRes.ok) setBadges(badgeRes.data);
      } else {
        setQuizIsCorrect(false);
        setQuizFeedback(res.data?.detail || "Incorrect answer, try again!");
      }
    } catch {
      setQuizFeedback("Failed to submit. Please try again.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Computed metrics
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const filteredChallenges =
    challengeFilter === "All"
      ? challenges
      : challengeFilter === "Pending"
      ? challenges.filter((c) => !c.completed)
      : challengeFilter === "Completed"
      ? challenges.filter((c) => c.completed)
      : challenges.filter((c) => c.subject === challengeFilter);

  const formatTimer = () =>
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="dashboard">
      <SidebarNav />

      <main className="dashboard-main">
        {/* WELCOME BANNER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">STUDY WORKSPACE</p>
            <h1>
              Welcome back, <em>{userName}</em>
            </h1>
            <p className="dashboard-subtitle">
              Track your daily focus, master syllabus challenges, and stay ahead.
            </p>
          </div>

          <div className="dashboard-date dashboard-progress">
            <div className="progress-heading">
              <span>TASK COMPLETION</span>
            </div>
            <strong className="progress-percent">
              {taskProgress}
              <small>%</small>
            </strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={taskProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="progress-fill"
                style={{ width: `${taskProgress}%` }}
              ></span>
            </div>
            <p className="progress-caption">
              {tasks.length === 0
                ? "Add a task to start tracking progress."
                : `${completedTasks} of ${tasks.length} tasks completed.`}
            </p>
          </div>
        </header>

        {/* 4 KEY METRIC CARDS */}
        <section className="overview-grid">
          <div className="overview-card">
            <span className="overview-number">{profile?.total_xp ?? 0}</span>
            <div>
              <strong>Total XP</strong>
              <p>Level {profile?.level ?? 1} · {profile?.title ?? "Rookie"}</p>
            </div>
            <span className="overview-arrow" aria-hidden="true">✦</span>
          </div>

          <div className="overview-card">
            <span className="overview-number">{profile?.current_streak ?? 0}</span>
            <div>
              <strong>Day Streak</strong>
              <p>Best: {profile?.longest_streak ?? 0} days</p>
            </div>
            <span className="overview-arrow" aria-hidden="true">⚡</span>
          </div>

          <div className="overview-card">
            <span className="overview-number">{completedTasks}/{tasks.length}</span>
            <div>
              <strong>Tasks Done</strong>
              <p>{tasks.length - completedTasks} remaining</p>
            </div>
            <span className="overview-arrow" aria-hidden="true">✓</span>
          </div>

          <div className="overview-card overview-card-accent">
            <span className="overview-number">{subjects.length}</span>
            <div>
              <strong>Subjects</strong>
              <p>In your curriculum</p>
            </div>
            <span className="overview-arrow" aria-hidden="true">▣</span>
          </div>
        </section>

        {/* DAILY GOAL & FOCUS TIMER ROW */}
        <section className="dashboard-content-grid" style={{ marginBottom: 28 }}>
          {/* DAILY PROGRESSIVE STUDY GOAL */}
          <article className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">PROGRESSIVE HABIT</p>
                <h2>Daily Study Goal</h2>
                <p>
                  {studyGoal?.goal_met
                    ? "✓ Today's study goal is completed!"
                    : "Complete focused study minutes to keep your streak alive."}
                </p>
              </div>
              <span className="panel-count">
                {studyGoal?.completed_minutes ?? 0}/{studyGoal?.target_minutes ?? 60}m
              </span>
            </div>

            <div
              className="progress-track"
              style={{ height: 12, borderRadius: 8, margin: "18px 0" }}
            >
              <span
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    (((studyGoal?.completed_seconds ?? 0) /
                      Math.max(1, (studyGoal?.target_minutes ?? 60) * 60)) *
                      100)
                  )}%`,
                }}
              ></span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--dash-muted)" }}>
              <span>
                {studyGoal?.goal_met
                  ? "Target achieved today!"
                  : `${studyGoal?.remaining_minutes ?? 60} min left today`}
              </span>
              <span>Tomorrow's Target: {studyGoal?.next_target_minutes ?? 60}m</span>
            </div>

            <p style={{ marginTop: 14, fontSize: 12, color: "var(--dash-muted)", lineHeight: 1.5 }}>
              Completing your goal increases tomorrow's target by 10 minutes to progressively build focus stamina.
            </p>
          </article>

          {/* QUICK FOCUS TIMER */}
          <article className="dashboard-panel timer-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">FOCUS SESSION</p>
                <h2>{timerRunning ? "Focus Session Active" : "Pomodoro Focus"}</h2>
                <p>Earn XP by logging dedicated study time.</p>
              </div>
              <span className="timer-mark" aria-hidden="true">◷</span>
            </div>

            <div className="timer-display" style={{ margin: "12px 0" }}>
              {formatTimer()}
            </div>

            <div className="timer-presets dashboard-timer-presets" style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setTimerPreset(25)}
                disabled={timerRunning}
              >
                25 min
              </button>
              <button
                type="button"
                onClick={() => setTimerPreset(50)}
                disabled={timerRunning}
              >
                50 min
              </button>
              <button
                type="button"
                onClick={() => setTimerPreset(15)}
                disabled={timerRunning}
              >
                15 min
              </button>
            </div>

            <div className="timer-controls">
              <button
                type="button"
                className="dashboard-button primary"
                onClick={timerRunning ? handleFinishSession : handleStartTimer}
              >
                {timerRunning ? "Pause & Record" : "Start Focus"}
              </button>
              <button
                type="button"
                className="dashboard-button ghost"
                onClick={handleResetTimer}
              >
                Reset
              </button>
              <Link to="/timer" className="dashboard-button ghost" style={{ textDecoration: "none" }}>
                Full Screen ↗
              </Link>
            </div>
          </article>
        </section>

        {/* QUICK TASKS & SUBJECTS SECTION */}
        <section className="dashboard-content-grid" style={{ marginBottom: 28 }}>
          {/* TASKS CARD */}
          <article className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">ACTION ITEMS</p>
                <h2>Recent Tasks</h2>
                <p>Keep your next priorities close at hand.</p>
              </div>
              <Link to="/tasks" style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-accent)" }}>
                View all ({tasks.length}) →
              </Link>
            </div>

            {/* Quick Add Task Form */}
            <form onSubmit={handleAddQuickTask} className="dashboard-add-row">
              <input
                type="text"
                placeholder="Quick add a task..."
                value={quickTask}
                onChange={(e) => setQuickTask(e.target.value)}
              />
              <button type="submit" className="dashboard-button primary">
                + Add
              </button>
            </form>

            <div className="dashboard-list">
              {loading ? (
                <div className="dashboard-empty">
                  <p>Loading your study tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="dashboard-empty">
                  <span>✓</span>
                  <div>
                    <strong>No tasks yet.</strong>
                    <p>Add your first study task to get started.</p>
                  </div>
                </div>
              ) : (
                tasks.slice(0, 5).map((item) => (
                  <div className="dashboard-list-item" key={item.id}>
                    <div className="list-leading" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleTask(item.id)}
                        className={`task-check ${item.completed ? "completed" : ""}`}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: "1px solid var(--dash-line)",
                          background: item.completed ? "var(--dash-accent)" : "white",
                          color: "white",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 14,
                        }}
                        aria-label={item.completed ? "Mark pending" : "Mark complete"}
                      >
                        {item.completed ? "✓" : ""}
                      </button>
                      <div>
                        <strong
                          style={{
                            textDecoration: item.completed ? "line-through" : "none",
                            color: item.completed ? "var(--dash-muted)" : "inherit",
                          }}
                        >
                          {item.title}
                        </strong>
                        <small style={{ display: "block", color: "var(--dash-muted)" }}>
                          {item.completed ? "Completed (+10 XP)" : "Pending"}
                        </small>
                      </div>
                    </div>

                    <div className="list-actions">
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(item.id)}
                        aria-label={`Delete ${item.title}`}
                        style={{ color: "var(--dash-danger)", background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          {/* SUBJECTS CARD */}
          <article className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">ORGANIZATION</p>
                <h2>My Subjects</h2>
                <p>Structured courses and study domains.</p>
              </div>
              <Link to="/subjects" style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-accent)" }}>
                View all ({subjects.length}) →
              </Link>
            </div>

            {/* Quick Add Subject Form */}
            <form onSubmit={handleAddQuickSubject} className="dashboard-add-row">
              <input
                type="text"
                placeholder="Quick add a subject..."
                value={quickSubject}
                onChange={(e) => setQuickSubject(e.target.value)}
              />
              <button type="submit" className="dashboard-button primary">
                + Add
              </button>
            </form>

            <div className="dashboard-list">
              {subjects.length === 0 ? (
                <div className="dashboard-empty">
                  <span>▣</span>
                  <div>
                    <strong>No subjects yet.</strong>
                    <p>Create subjects like Mathematics, Physics, or Programming.</p>
                  </div>
                </div>
              ) : (
                subjects.slice(0, 5).map((item, index) => (
                  <div className="dashboard-list-item" key={item.id}>
                    <div className="list-leading">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>Active Subject</small>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        {/* LEARNING CHALLENGES & GAMIFICATION */}
        <section className="game-section">
          <div className="game-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <p className="panel-kicker" style={{ margin: 0 }}>SYLLABUS MASTERY</p>
                <span style={{ fontSize: 11, background: "rgba(196, 122, 67, 0.12)", color: "var(--dash-accent)", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  ✨ AI DAILY CHALLENGE SET
                </span>
                {dailySetDate && (
                  <span style={{ fontSize: 11, color: "var(--dash-muted)", fontWeight: 600 }}>
                    ({dailySetDate})
                  </span>
                )}
              </div>
              <h2>Learning Challenges &amp; Quizzes</h2>
              <p>Test your knowledge on core concepts and earn XP toward level progression.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="dashboard-button ghost"
                onClick={handleRegenerateChallenges}
                disabled={generatingChallenges}
                style={{ fontSize: 13, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}
                title="Generate fresh AI curriculum challenges"
              >
                <span>{generatingChallenges ? "⏳" : "⚡"}</span>
                {generatingChallenges ? "Generating AI Questions..." : "New Daily Set"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dash-muted)" }}>Target Course:</span>
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1.5px solid var(--dash-line)",
                  background: "var(--dash-paper-light)",
                  color: "var(--dash-ink)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="JEE (Main & Advanced)">JEE (Main & Advanced)</option>
                <option value="NEET (UG Medical)">NEET (UG Medical)</option>
                <option value="Class 12th Board Exam">Class 12th Board Exam</option>
                <option value="B.Tech (Computer Science & Engineering)">B.Tech (Computer Science & Engineering)</option>
                <option value="All Courses">All Courses</option>
              </select>
            </div>
          </div>
        </div>

          <div className="game-filters" style={{ marginBottom: 18 }}>
            {["All", "Pending", "Completed"].map((filter) => (
              <button
                key={filter}
                type="button"
                className={challengeFilter === filter ? "active" : ""}
                onClick={() => setChallengeFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="game-challenges-grid">
            {filteredChallenges.length === 0 ? (
              <p className="game-empty">No challenges in this filter.</p>
            ) : (
              filteredChallenges.map((challenge) => (
                <article
                  className={`game-challenge-card ${challenge.completed ? "is-completed" : ""}`}
                  key={challenge.id}
                >
                  <div className="game-challenge-top">
                    <span className="game-subject-tag">{challenge.subject}</span>
                    <span className={`game-difficulty ${String(challenge.difficulty || "easy").toLowerCase()}`}>
                      {challenge.difficulty}
                    </span>
                  </div>

                  <h4>{challenge.title}</h4>
                  <p className="game-challenge-description">{challenge.question || challenge.description}</p>

                  <div className="game-challenge-footer">
                    <span className="game-xp-reward">+{challenge.xp_reward} XP</span>
                    {challenge.completed ? (
                      <span className="game-complete-badge" style={{ color: "var(--dash-green)", fontWeight: 700, fontSize: 13 }}>
                        ✓ Completed
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="game-complete-button"
                        onClick={() => handleOpenQuiz(challenge)}
                        style={{ cursor: "pointer" }}
                      >
                        Solve Quiz →
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          {/* BADGES SECTION */}
          {badges.length > 0 && (
            <article className="game-panel" style={{ marginTop: 24 }}>
              <div className="game-level-heading">
                <div>
                  <span className="game-muted-label">ACHIEVEMENTS</span>
                  <h3>Study Badges</h3>
                </div>
                <strong>{badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked</strong>
              </div>

              <div className="game-badges-grid">
                {badges.map((badge) => (
                  <div
                    className={`game-badge-card ${badge.unlocked ? "unlocked" : "locked"}`}
                    key={badge.key}
                  >
                    <span className="game-badge-icon" aria-hidden="true">
                      {badge.unlocked ? "✦" : "◇"}
                    </span>
                    <strong>{badge.name}</strong>
                    <p>{badge.description}</p>
                    <small>{badge.unlocked ? "UNLOCKED" : "LOCKED"}</small>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* COMMUNITY STUDY LEADERBOARD */}
          <article className="game-panel" style={{ marginTop: 28 }}>
            <div className="game-level-heading" style={{ flexWrap: "wrap", gap: 12 }}>
              <div>
                <span className="game-muted-label" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>🏆</span> COMMUNITY STANDINGS
                </span>
                <h3 style={{ margin: "4px 0 0" }}>Live Student Leaderboard</h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
                  Compare XP, current streaks, and ranking across all batches
                </p>
              </div>

              {leaderboardStanding && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>🎯</span>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>
                      Your Standing
                    </div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1e3a8a" }}>
                      Rank #{leaderboardStanding.rank} · {leaderboardStanding.total_xp} XP
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LEADERBOARD TABLE */}
            <div style={{ marginTop: 20, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                <thead>
                  <tr style={{ color: "#64748b", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ textAlign: "center", padding: "8px 12px", width: 60 }}>Rank</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Student & Batch</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", width: 90 }}>Streak</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", width: 110 }}>Level</th>
                    <th style={{ textAlign: "right", padding: "8px 16px", width: 110 }}>Total XP</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                        Loading student standings...
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((item) => {
                      const isTop3 = item.rank <= 3;
                      const rankBadge =
                        item.rank === 1 ? "🥇 #1" : item.rank === 2 ? "🥈 #2" : item.rank === 3 ? "🥉 #3" : `#${item.rank}`;

                      return (
                        <tr
                          key={item.user_id}
                          style={{
                            background: item.is_current_user
                              ? "linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%)"
                              : isTop3
                              ? "#fafaf9"
                              : "#ffffff",
                            border: item.is_current_user
                              ? "1.5px solid #10b981"
                              : "1px solid #e2e8f0",
                            borderRadius: 12,
                            boxShadow: item.is_current_user
                              ? "0 4px 12px rgba(16, 185, 129, 0.12)"
                              : "0 1px 3px rgba(0,0,0,0.02)",
                            transition: "transform 0.15s ease",
                          }}
                        >
                          {/* RANK */}
                          <td style={{ textAlign: "center", padding: "14px 12px", fontWeight: 800 }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: 8,
                                fontSize: "0.84rem",
                                background:
                                  item.rank === 1
                                    ? "#fef3c7"
                                    : item.rank === 2
                                    ? "#f1f5f9"
                                    : item.rank === 3
                                    ? "#ffedd5"
                                    : "transparent",
                                color:
                                  item.rank === 1
                                    ? "#92400e"
                                    : item.rank === 2
                                    ? "#475569"
                                    : item.rank === 3
                                    ? "#9a3412"
                                    : "#64748b",
                              }}
                            >
                              {rankBadge}
                            </span>
                          </td>

                          {/* NAME & BATCH */}
                          <td style={{ padding: "14px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: item.is_current_user ? 800 : 700, color: "#1e293b", fontSize: "0.95rem" }}>
                                {item.name}
                              </span>

                              {item.is_current_user && (
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    background: "#10b981",
                                    color: "white",
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                    letterSpacing: "0.03em",
                                  }}
                                >
                                  YOU
                                </span>
                              )}

                              {/* BATCH / COURSE TAG */}
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: "#0369a1",
                                  background: "#e0f2fe",
                                  border: "1px solid #bae6fd",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <span style={{ fontSize: "0.7rem" }}>📚</span>
                                {item.course}
                              </span>
                            </div>
                          </td>

                          {/* STREAK */}
                          <td style={{ textAlign: "center", padding: "14px 12px", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                            {item.current_streak > 0 ? (
                              <span style={{ color: "#ea580c" }}>🔥 {item.current_streak}d</span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>

                          {/* LEVEL */}
                          <td style={{ textAlign: "center", padding: "14px 12px" }}>
                            <span
                              style={{
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                color: "#4338ca",
                                background: "#e0e7ff",
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              Lvl {item.level} · {item.title}
                            </span>
                          </td>

                          {/* TOTAL XP */}
                          <td style={{ textAlign: "right", padding: "14px 16px" }}>
                            <span style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0f172a" }}>
                              ⚡ {item.total_xp.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        {/* FEEDBACK TOAST */}
        {message && (
          <div className="dashboard-message" role="status">
            <span>•</span>
            {message}
          </div>
        )}

        <SiteFooter />
      </main>

      {/* QUIZ MODAL */}
      {activeQuizChallenge && (
        <div
          className="quote-modal"
          role="dialog"
          aria-modal="true"
          aria-label={activeQuizChallenge.title}
          onClick={handleCloseQuiz}
        >
          <div
            className="quote-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, padding: 32, background: "white", borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="game-subject-tag">{activeQuizChallenge.subject}</span>
                <span className={`game-difficulty ${String(activeQuizChallenge.difficulty || "easy").toLowerCase()}`}>
                  {activeQuizChallenge.difficulty}
                </span>
                <span style={{ fontSize: 11, background: "rgba(196, 122, 67, 0.12)", color: "var(--dash-accent)", padding: "2px 6px", borderRadius: 8, fontWeight: 700 }}>
                  AI Generated
                </span>
              </div>
              <span className="game-xp-reward">+{activeQuizChallenge.xp_reward} XP</span>
            </div>

            <h3 style={{ margin: "0 0 10px", fontSize: 20 }}>{activeQuizChallenge.title}</h3>
            <p style={{ color: "var(--dash-ink)", marginBottom: 20, fontSize: 15, lineHeight: 1.5, fontWeight: 500 }}>
              {activeQuizChallenge.question || activeQuizChallenge.description}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {(
                activeQuizChallenge.options && activeQuizChallenge.options.length > 0
                  ? activeQuizChallenge.options
                  : ["Option A", "Option B", "Option C", "Option D"]
              ).map((option) => (
                <label
                  key={option}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${selectedAnswer === option ? "var(--dash-accent)" : "var(--dash-line)"}`,
                    background: selectedAnswer === option ? "#f6f4f8" : "transparent",
                    cursor: quizIsCorrect ? "default" : "pointer",
                    fontSize: 14,
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    type="radio"
                    name="quiz-answer"
                    value={option}
                    disabled={quizSubmitting || quizIsCorrect}
                    checked={selectedAnswer === option}
                    onChange={() => setSelectedAnswer(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {quizFeedback && !quizIsCorrect && (
              <div style={{
                background: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.25)",
                borderRadius: 10,
                padding: "10px 14px",
                color: "var(--dash-danger)",
                fontSize: 13,
                marginBottom: 16
              }}>
                {quizFeedback}
              </div>
            )}

            {quizIsCorrect && (
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 20
              }}>
                <div style={{ color: "var(--dash-green)", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                  ✓ Correct Answer! +{activeQuizChallenge.xp_reward} XP
                </div>
                {quizExplanation && (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--dash-ink)", lineHeight: 1.5 }}>
                    <strong>Explanation:</strong> {quizExplanation}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="dashboard-button ghost"
                onClick={handleCloseQuiz}
                disabled={quizSubmitting}
              >
                {quizIsCorrect ? "Close" : "Cancel"}
              </button>
              {!quizIsCorrect && (
                <button
                  type="button"
                  className="dashboard-button primary"
                  onClick={handleSubmitQuiz}
                  disabled={quizSubmitting || !selectedAnswer}
                >
                  {quizSubmitting ? "Checking..." : "Submit Answer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
