import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import "./GamifiedLearning.css";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch } from "./api";
import confetti from "canvas-confetti";

const CHALLENGE_QUIZZES: Record<string, { question: string; options: string[] }> = {
  // B.Tech / CSE
  "c-control-flow": {
    question: "Which condition tests if an integer 'n' is even in C?",
    options: ["n % 2 == 0", "n / 2 == 0", "n & 2 == 1", "n % 2 != 0"],
  },
  "c-loops": {
    question: "Which loop is best suited when the number of iterations is known beforehand?",
    options: ["for loop", "while (1)", "do-while loop", "goto loop"],
  },
  "c-functions": {
    question: "What is the defining condition for a prime number greater than 1?",
    options: [
      "It has exactly two positive divisors",
      "It is divisible by any even number",
      "It is always odd",
      "It has no factors other than 0",
    ],
  },
  "c-recursion": {
    question: "What is the fundamental purpose of a base case in recursion?",
    options: [
      "To stop recursive calls",
      "To allocate more memory",
      "To execute loops faster",
      "To double the input",
    ],
  },
  "c-arrays": {
    question: "What is the prerequisite condition for applying binary search?",
    options: ["Sorted", "Reverse sorted only", "Unsorted", "Empty"],
  },
  "math-matrices": {
    question: "When is matrix multiplication A x B defined?",
    options: [
      "Rows of A equal columns of B",
      "Columns of A equal rows of B",
      "Both must be identity",
      "Both must have identical dimensions",
    ],
  },
  "math-determinants": {
    question: "What is the determinant of a 2x2 matrix [[a, b], [c, d]]?",
    options: ["ad - bc", "ab - cd", "ac - bd", "a + d - (b + c)"],
  },
  "math-eigenvalues": {
    question: "What characteristic equation is solved to find eigenvalues lambda of matrix A?",
    options: [
      "det(A - lambda*I) = 0",
      "trace(A) = lambda",
      "A * lambda = 0",
      "det(A) + lambda = 0",
    ],
  },
  "math-gauss-seidel": {
    question: "What matrix property guarantees convergence for the Gauss-Seidel method?",
    options: [
      "Strictly diagonally dominant",
      "Singular",
      "Upper triangular only",
      "Zero determinant",
    ],
  },
  "physics-wave-particle": {
    question: "What is the de Broglie wavelength formula for a particle of momentum p?",
    options: ["lambda = h / p", "lambda = p / h", "lambda = h * p", "lambda = h * c"],
  },
  "physics-wavefunction": {
    question: "According to Born's interpretation, what does |psi|^2 represent?",
    options: [
      "Probability density",
      "Wave frequency",
      "Total kinetic energy",
      "Particle charge",
    ],
  },
  "physics-schrodinger": {
    question: "The time-independent Schrodinger equation expresses which fundamental principle?",
    options: [
      "Energy conservation",
      "Mass conservation",
      "Charge conservation",
      "Wave attenuation",
    ],
  },
  "physics-particle-box": {
    question: "How do the energy levels of a 1D particle in a box scale with quantum number n?",
    options: [
      "En proportional to n^2",
      "En proportional to n",
      "En proportional to 1/n",
      "En is constant",
    ],
  },

  // JEE (Main & Advanced)
  "jee-phys-kinematics": {
    question: "What is the horizontal range of a projectile fired with speed u at angle theta?",
    options: ["u^2 * sin(2*theta) / g", "u^2 * sin^2(theta) / (2*g)", "2 * u * sin(theta) / g", "u^2 / (2*g)"],
  },
  "jee-phys-rotational": {
    question: "What is the moment of inertia of a solid cylinder of mass M and radius R about its longitudinal axis?",
    options: ["(1/2) * M * R^2", "M * R^2", "(2/5) * M * R^2", "(1/12) * M * R^2"],
  },
  "jee-phys-thermo": {
    question: "What is the theoretical maximum efficiency of a Carnot heat engine operating between source T1 and sink T2?",
    options: ["1 - (T2 / T1)", "1 + (T2 / T1)", "T2 / T1", "(T1 - T2) / T2"],
  },
  "jee-chem-hybridization": {
    question: "What is the hybridization and VSEPR geometry of Sulfur Hexafluoride (SF6)?",
    options: ["sp3d2 (Octahedral)", "sp3d (Trigonal bipyramidal)", "sp3 (Tetrahedral)", "dsp2 (Square planar)"],
  },
  "jee-chem-thermo": {
    question: "Under constant temperature and pressure, which condition guarantees a spontaneous process?",
    options: ["Delta G < 0", "Delta H > 0", "Delta S < 0", "Delta G > 0"],
  },
  "jee-chem-organic": {
    question: "What is the stereochemical outcome when a chiral substrate undergoes an SN1 substitution?",
    options: ["Racemization with partial inversion", "100% Inversion (Walden inversion)", "100% Retention of configuration", "Complete dimerization"],
  },
  "jee-math-calculus": {
    question: "What is the value of the definite integral of sin^5(x) from -pi/2 to pi/2?",
    options: ["0 (Odd function property)", "1", "pi / 2", "2 / 5"],
  },
  "jee-math-matrices": {
    question: "Which condition must the coefficient matrix A satisfy for a linear system AX = B to have a unique solution?",
    options: ["det(A) != 0", "det(A) == 0", "trace(A) == 0", "rank(A) == 0"],
  },
  "jee-math-conics": {
    question: "What is the standard equation of the tangent with slope m to the parabola y^2 = 4ax?",
    options: ["y = m*x + a/m", "y = m*x - a*m^2", "y = m*x + a*m", "y = m*x - a/m"],
  },

  // NEET (UG Medical)
  "neet-bio-cell": {
    question: "Which organelle is responsible for generating cellular ATP via oxidative phosphorylation?",
    options: ["Mitochondria", "Endoplasmic Reticulum", "Golgi Apparatus", "Lysosome"],
  },
  "neet-bio-genetics": {
    question: "What is the standard phenotypic ratio in the F2 generation of a Mendelian dihybrid cross?",
    options: ["9:3:3:1", "3:1", "1:2:1", "9:7"],
  },
  "neet-bio-cardiac": {
    question: "Which structure acts as the primary intrinsic pacemaker of the human heart?",
    options: ["Sinoatrial (SA) Node", "Atrioventricular (AV) Node", "Purkinje Fibres", "Bundle of His"],
  },
  "neet-bio-photosynthesis": {
    question: "What is the initial acceptor molecule for CO2 in mesophyll cells of C4 plants?",
    options: ["PEP (Phosphoenolpyruvate)", "RuBP (Ribulose 1,5-bisphosphate)", "OAA (Oxaloacetate)", "PGA (Phosphoglycerate)"],
  },
  "neet-chem-biomolecules": {
    question: "Which covalent linkage binds consecutive amino acids in proteins?",
    options: ["Peptide Linkage (-CONH-)", "Glycosidic bond", "Phosphodiester bond", "Ester bond"],
  },
  "neet-chem-kinetics": {
    question: "What is the half-life equation for a first order chemical reaction?",
    options: ["t_1/2 = 0.693 / k", "t_1/2 = [A]_0 / (2*k)", "t_1/2 = 1 / (k * [A]_0)", "t_1/2 = k / 0.693"],
  },
  "neet-phys-optics": {
    question: "For total internal reflection from a medium of refractive index mu into air, what is the critical angle theta_c?",
    options: ["sin(theta_c) = 1 / mu", "cos(theta_c) = 1 / mu", "tan(theta_c) = mu", "sin(theta_c) = mu"],
  },
  "neet-phys-circuits": {
    question: "What is the bridge balance condition where zero current flows through the central galvanometer?",
    options: ["P / Q = R / S", "P * Q = R * S", "P + Q = R + S", "P / R = S / Q"],
  },

  // Class 12th Board Exam
  "cbse-phys-gauss": {
    question: "According to Gauss's Law, what is the total electric flux through a closed surface enclosing charge q?",
    options: ["q / epsilon_0", "q * epsilon_0", "4 * pi * q / epsilon_0", "zero"],
  },
  "cbse-phys-drift": {
    question: "What is the expression for drift velocity of electrons in a conductor under electric field E?",
    options: ["v_d = (e * E * tau) / m", "v_d = (e * tau) / (m * E)", "v_d = (m * E) / (e * tau)", "v_d = e * E * m * tau"],
  },
  "cbse-chem-boiling": {
    question: "Which formula relates the boiling point elevation Delta T_b of a non-volatile solute to its molality m?",
    options: ["Delta T_b = K_b * m", "Delta T_b = K_b / m", "Delta T_b = K_f * m", "Delta T_b = i * P_0"],
  },
  "cbse-chem-nernst": {
    question: "What is the simplified Nernst equation for a cell reaction at 298 K?",
    options: ["E = E0 - (0.0591 / n) * log(Q)", "E = E0 + (0.0591 / n) * log(Q)", "E = E0 - (R * T / n) * ln(Q)", "E = E0 * (0.0591 / n)"],
  },
  "cbse-math-relations": {
    question: "Which three properties must a relation satisfy simultaneously to be an equivalence relation?",
    options: ["Reflexive, Symmetric, and Transitive", "Reflexive, Anti-symmetric, and Transitive", "Symmetric, Identity, and Injective", "Bijective, Invertible, and Continuous"],
  },
  "cbse-math-derivative": {
    question: "What is the derivative of e^(sin x) with respect to x?",
    options: ["cos(x) * e^(sin x)", "-cos(x) * e^(sin x)", "sin(x) * e^(sin x)", "e^(cos x)"],
  },
};

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

  // Quiz modal
  const [activeQuizChallenge, setActiveQuizChallenge] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
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
      const [subsRes, tasksRes, profRes, chalRes, badgeRes, goalRes] =
        await Promise.all([
          apiFetch("/api/subjects"),
          apiFetch("/api/tasks"),
          apiFetch("/api/gamification/profile"),
          apiFetch(`/api/gamification/challenges?course=${encodeURIComponent(userCourse)}`),
          apiFetch("/api/gamification/badges"),
          apiFetch("/api/study/goal"),
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
      if (chalRes.ok && Array.isArray(chalRes.data)) {
        setChallenges(chalRes.data);
      }
      if (badgeRes.ok && Array.isArray(badgeRes.data)) {
        setBadges(badgeRes.data);
      }
      if (goalRes.ok && goalRes.data) {
        setStudyGoal(goalRes.data);
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
        `/api/gamification/challenges${newCourse === "All Courses" ? "?course=all" : `?course=${encodeURIComponent(newCourse)}`}`
      );
      if (chalRes.ok && Array.isArray(chalRes.data)) {
        setChallenges(chalRes.data);
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
  };

  const handleCloseQuiz = () => {
    setActiveQuizChallenge(null);
    setSelectedAnswer("");
    setQuizFeedback("");
  };

  const handleSubmitQuiz = async () => {
    if (!selectedAnswer || !activeQuizChallenge) return;
    try {
      setQuizSubmitting(true);
      setQuizFeedback("");
      const res = await apiFetch(
        `/api/gamification/challenges/${activeQuizChallenge.id}/complete`,
        {
          method: "POST",
          body: JSON.stringify({ selected_answer: selectedAnswer }),
        }
      );

      if (res.ok) {
        setMessage(`Challenge completed! +${activeQuizChallenge.xp_reward} XP! ✦`);
        handleCloseQuiz();
        // Refresh challenges and profile
        const chalUrl = `/api/gamification/challenges${selectedCourse === "All Courses" ? "?course=all" : `?course=${encodeURIComponent(selectedCourse)}`}`;
        const [chalRes, profRes, badgeRes] = await Promise.all([
          apiFetch(chalUrl),
          apiFetch("/api/gamification/profile"),
          apiFetch("/api/gamification/badges"),
        ]);
        if (chalRes.ok) setChallenges(chalRes.data);
        if (profRes.ok) setProfile(profRes.data);
        if (badgeRes.ok) setBadges(badgeRes.data);
      } else {
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
              <p className="panel-kicker">SYLLABUS MASTERY</p>
              <h2>Learning Challenges &amp; Quizzes</h2>
              <p>Test your knowledge on core concepts and earn XP toward level progression.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                  <p className="game-challenge-description">{challenge.description}</p>

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
            style={{ maxWidth: 540, padding: 32, background: "white", borderRadius: 24 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="game-subject-tag">{activeQuizChallenge.subject}</span>
              <span className="game-xp-reward">+{activeQuizChallenge.xp_reward} XP</span>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 20 }}>{activeQuizChallenge.title}</h3>
            <p style={{ color: "var(--dash-muted)", marginBottom: 20, fontSize: 14 }}>
              {CHALLENGE_QUIZZES[activeQuizChallenge.slug]?.question ||
                activeQuizChallenge.description}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {(
                CHALLENGE_QUIZZES[activeQuizChallenge.slug]?.options || [
                  "Option A",
                  "Option B",
                  "Option C",
                ]
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
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  <input
                    type="radio"
                    name="quiz-answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => setSelectedAnswer(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {quizFeedback && (
              <p style={{ color: "var(--dash-danger)", fontSize: 13, marginBottom: 16 }}>
                {quizFeedback}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="dashboard-button ghost"
                onClick={handleCloseQuiz}
                disabled={quizSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dashboard-button primary"
                onClick={handleSubmitQuiz}
                disabled={quizSubmitting || !selectedAnswer}
              >
                {quizSubmitting ? "Checking..." : "Submit Answer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
