import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch, getCurrentUser } from "./api";
import confetti from "canvas-confetti";
import "./TestGenerator.css";
import "./FeatureSuite.css";

interface SubjectPreset {
  name: string;
  chapters: string[];
}

interface CoursePreset {
  course: string;
  subjects: SubjectPreset[];
}

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer?: string;
  explanation?: string;
}

interface TestData {
  id: number;
  course: string;
  subject: string;
  chapter: string;
  difficulty: string;
  total_questions: number;
  time_limit_minutes: number;
  questions: Question[];
}

interface ReviewItem {
  question_id: number;
  question_text: string;
  options: string[];
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

interface SubmissionResult {
  attempt_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_seconds: number;
  xp_awarded: number;
  answers_review: ReviewItem[];
}

interface HistoryItem {
  id: number;
  test_id: number;
  course: string;
  subject: string;
  chapter: string;
  difficulty: string;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_seconds: number;
  completed_at: string;
}

const DEFAULT_PRESETS: CoursePreset[] = [
  {
    course: "B.Tech Computer Science (CSE)",
    subjects: [
      {
        name: "Operating Systems",
        chapters: [
          "Process Management & States",
          "CPU Scheduling Algorithms",
          "Process Synchronization & Semaphores",
          "Deadlock Detection & Prevention",
          "Memory Management & Paging",
          "Virtual Memory & Page Replacement"
        ]
      },
      {
        name: "Database Management Systems (DBMS)",
        chapters: [
          "ER Modeling & Relational Schema",
          "Relational Algebra & SQL Queries",
          "Normalization (1NF, 2NF, 3NF, BCNF)",
          "Transactions & ACID Properties"
        ]
      },
      {
        name: "Data Structures & Algorithms",
        chapters: [
          "Arrays, Stacks & Queues",
          "Linked Lists (Singly, Doubly, Circular)",
          "Binary Trees & BST",
          "Graphs, BFS & DFS",
          "Sorting & Searching Algorithms"
        ]
      }
    ]
  },
  {
    course: "B.Tech First Year (Engineering Foundation)",
    subjects: [
      {
        name: "Engineering Mathematics - I",
        chapters: [
          "Matrices & Rank of Matrix",
          "Eigenvalues & Eigenvectors",
          "Differential Calculus & Series",
          "Multiple Integrals (Double & Triple)"
        ]
      },
      {
        name: "Engineering Physics",
        chapters: [
          "Wave-Particle Duality & de Broglie",
          "Schrodinger Wave Equation",
          "Interference & Diffraction",
          "Lasers & Fiber Optics"
        ]
      }
    ]
  },
  {
    course: "Class 12th (Science / PCM)",
    subjects: [
      {
        name: "Physics",
        chapters: [
          "Electric Charges & Fields",
          "Current Electricity & Kirchhoff's Rules",
          "Ray Optics & Wave Optics",
          "Dual Nature of Radiation & Matter"
        ]
      },
      {
        name: "Mathematics",
        chapters: [
          "Matrices and Determinants",
          "Continuity and Differentiability",
          "Integrals (Definite & Indefinite)",
          "Vector Algebra & 3D Geometry"
        ]
      }
    ]
  }
];

export default function TestGenerator() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [mode, setMode] = useState<"config" | "taking" | "scorecard" | "history">("config");
  const [presets, setPresets] = useState<CoursePreset[]>(DEFAULT_PRESETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedCourse, setSelectedCourse] = useState<string>("B.Tech Computer Science (CSE)");
  const [customCourse, setCustomCourse] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("Operating Systems");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("Process Management & States");
  const [customChapter, setCustomChapter] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timeLimit, setTimeLimit] = useState<number>(10);

  // Active Test State
  const [activeTest, setActiveTest] = useState<TestData | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Scorecard State
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    async function loadPresets() {
      try {
        const res = await apiFetch("/api/tests/presets");
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          setPresets(res.data);
          const first = res.data[0];
          setSelectedCourse(first.course);
          if (first.subjects.length > 0) {
            setSelectedSubject(first.subjects[0].name);
            if (first.subjects[0].chapters.length > 0) {
              setSelectedChapter(first.subjects[0].chapters[0]);
            }
          }
        }
      } catch (err: any) {
        // Fallback to default presets if backend is offline
        console.warn("Using offline presets:", err.message);
      }
    }

    loadPresets();
  }, []);

  const currentCourseObj = presets.find((p) => p.course === selectedCourse) || presets[0];
  const availableSubjects = currentCourseObj ? currentCourseObj.subjects : [];
  const currentSubjectObj = availableSubjects.find((s) => s.name === selectedSubject) || availableSubjects[0];
  const availableChapters = currentSubjectObj ? currentSubjectObj.chapters : [];

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course);
    const found = presets.find((p) => p.course === course);
    if (found && found.subjects.length > 0) {
      setSelectedSubject(found.subjects[0].name);
      if (found.subjects[0].chapters.length > 0) {
        setSelectedChapter(found.subjects[0].chapters[0]);
      } else {
        setSelectedChapter("");
      }
    } else {
      setSelectedSubject("");
      setSelectedChapter("");
    }
  };

  const handleSubjectChange = (subj: string) => {
    setSelectedSubject(subj);
    const found = availableSubjects.find((s) => s.name === subj);
    if (found && found.chapters.length > 0) {
      setSelectedChapter(found.chapters[0]);
    } else {
      setSelectedChapter("");
    }
  };

  // Timer countdown
  useEffect(() => {
    if (mode !== "taking" || timeLimit === 0) return;
    if (secondsRemaining <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, secondsRemaining, timeLimit]);

  // Client-side fallback question synthesis
  const generateClientFallbackTest = (course: string, subject: string, chapter: string, count: number): TestData => {
    const questions: Question[] = [];
    const sampleTopics = [
      {
        q: `In the study of ${chapter} within ${subject}, what is the primary fundamental objective?`,
        correct: `To ensure correct state transitions, minimal latency, and optimal resource utilization in ${subject}`,
        distractors: [
          "To consume all CPU cycles needlessly",
          "To disable all hardware interrupts permanently",
          "To enforce random memory leaks"
        ],
        exp: `Understanding the primary objective of ${chapter} helps students optimize performance and design sound systems in ${subject}.`
      },
      {
        q: `Which of the following principles is most critical when analyzing ${chapter}?`,
        correct: "Consistency, bounded waiting, and formal verification of boundary constraints",
        distractors: [
          "Ignoring base cases and error boundaries",
          "Hardcoding output values without computation",
          "Eliminating memory protection mechanisms"
        ],
        exp: `Mathematical consistency and boundary condition checks are fundamental requirements in ${chapter}.`
      },
      {
        q: `What is a common architectural trade-off encountered in ${chapter}?`,
        correct: "Throughput and speed versus algorithmic complexity and memory overhead",
        distractors: [
          "Zero power consumption versus infinite bandwidth",
          "Higher latency yielding faster execution time",
          "Reducing register bits to increase floating point precision"
        ],
        exp: `Practitioners must regularly balance algorithmic speed against the required space and computational complexity in ${chapter}.`
      },
      {
        q: `When implementing solutions for ${chapter}, what precaution prevents critical failures?`,
        correct: "Handling edge cases, race conditions, and enforcing atomic operations",
        distractors: [
          "Omitting synchronization primitives completely",
          "Allowing unrestricted concurrent writes to shared variables",
          "Suppressing compiler warnings without investigation"
        ],
        exp: `Atomicity and defensive validation prevent race conditions and system deadlocks in ${chapter}.`
      },
      {
        q: `How does mastering ${chapter} benefit professional engineers in ${course}?`,
        correct: `It forms a foundational building block for scalable, maintainable, and high-performance solutions in ${subject}`,
        distractors: [
          "It has zero application in modern technology",
          "Only used for decorative presentation graphics",
          "Restricted strictly to paper archives without computers"
        ],
        exp: `Core concepts of ${chapter} provide analytical frameworks directly applied in modern engineering and software development.`
      }
    ];

    for (let i = 0; i < count; i++) {
      const item = sampleTopics[i % sampleTopics.length];
      const opts = [item.correct, ...item.distractors].sort(() => 0.5 - Math.random());
      questions.push({
        id: i + 1,
        question_text: item.q,
        options: opts,
        correct_answer: item.correct,
        explanation: item.exp
      });
    }

    return {
      id: Math.floor(Math.random() * 10000) + 1,
      course,
      subject,
      chapter,
      difficulty,
      total_questions: count,
      time_limit_minutes: timeLimit,
      questions
    };
  };

  // Handle Generate Test
  const handleGenerateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const course = isCustomMode ? customCourse.trim() : selectedCourse;
    const subject = isCustomMode ? customSubject.trim() : (customSubject.trim() || selectedSubject);
    const chapter = isCustomMode ? customChapter.trim() : (customChapter.trim() || selectedChapter);

    if (!course) {
      setError("Please select or enter a course name.");
      return;
    }
    if (!subject) {
      setError("Please select or enter a subject name.");
      return;
    }
    if (!chapter) {
      setError("Please select or enter a chapter / topic name.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/tests/generate", {
        method: "POST",
        body: JSON.stringify({
          course,
          subject,
          chapter,
          num_questions: numQuestions,
          difficulty,
          time_limit_minutes: timeLimit,
        }),
      });

      if (res.ok && res.data?.questions) {
        setActiveTest(res.data);
      } else {
        // Fallback to client synthesis if backend had an issue
        const fallback = generateClientFallbackTest(course, subject, chapter, numQuestions);
        setActiveTest(fallback);
      }

      setUserAnswers({});
      setCurrentQIndex(0);
      setSecondsRemaining(timeLimit > 0 ? timeLimit * 60 : 0);
      setStartTime(Date.now());
      setMode("taking");
    } catch {
      // Offline fallback: generate directly so student is never blocked
      const fallback = generateClientFallbackTest(course, subject, chapter, numQuestions);
      setActiveTest(fallback);
      setUserAnswers({});
      setCurrentQIndex(0);
      setSecondsRemaining(timeLimit > 0 ? timeLimit * 60 : 0);
      setStartTime(Date.now());
      setMode("taking");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionText: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionText,
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTest) return;
    setLoading(true);
    setError(null);

    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const res = await apiFetch(`/api/tests/${activeTest.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: userAnswers,
          time_taken_seconds: timeSpent,
        }),
      });

      if (res.ok && res.data?.answers_review) {
        setSubmissionResult(res.data);
        if (res.data.percentage >= 70) {
          try { confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } }); } catch {}
        }
        setMode("scorecard");
        return;
      }
    } catch {
      // Fallback evaluation on client
    }

    // Client grading fallback
    let score = 0;
    const review: ReviewItem[] = activeTest.questions.map((q) => {
      const userChoice = userAnswers[String(q.id)];
      const isCorrect = userChoice && q.correct_answer ? userChoice.trim() === q.correct_answer.trim() : Boolean(userChoice);
      if (isCorrect) score++;

      return {
        question_id: q.id,
        question_text: q.question_text,
        options: q.options,
        user_answer: userChoice || null,
        correct_answer: q.correct_answer || q.options[0],
        is_correct: isCorrect,
        explanation: q.explanation || `Mastering this core concept ensures strong exam performance in ${activeTest.subject}.`
      };
    });

    const pct = Math.round((score / activeTest.questions.length) * 100);
    const xp = score * 15 + (pct >= 80 ? 20 : 0);

    if (pct >= 70) {
      try { confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } }); } catch {}
    }

    setSubmissionResult({
      attempt_id: Date.now(),
      score,
      total_marks: activeTest.questions.length,
      percentage: pct,
      time_taken_seconds: timeSpent,
      xp_awarded: xp,
      answers_review: review
    });
    setMode("scorecard");
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiFetch("/api/tests/history");
      if (res.ok && Array.isArray(res.data)) {
        setHistoryList(res.data);
      }
    } catch (err: any) {
      console.warn("Could not fetch server history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="feature-app-page test-generator-page">
      <SidebarNav />

      <main className="feature-app-main">
        {/* Header */}
        <header className="feature-app-header">
          <div>
            <p className="feature-app-eyebrow">CURRICULUM PRACTICE ENGINE</p>
            <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>AI Test Generator</h1>
            <p className="feature-app-lead" style={{ marginTop: 8, color: "var(--muted, #6d6860)", fontSize: 15 }}>
              Generate tailored chapter-level tests dynamically for your Course, Subject, and Chapter name.
            </p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="test-nav-tabs">
          <button
            type="button"
            onClick={() => {
              setMode("config");
              setError(null);
            }}
            className={`test-nav-tab ${mode === "config" || mode === "taking" || mode === "scorecard" ? "active" : ""}`}
          >
            Create Test & Practice
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("history");
              loadHistory();
            }}
            className={`test-nav-tab ${mode === "history" ? "active" : ""}`}
          >
            Past Test History
          </button>

          {mode === "taking" && activeTest && (
            <div className="test-timer-badge">
              <span>Time Left:</span>
              <strong>{timeLimit > 0 ? formatSeconds(secondsRemaining) : "Untimed"}</strong>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "14px 20px", background: "#fdedec", color: "#b03a2e", borderRadius: 10, marginBottom: 24, fontSize: 13, border: "1px solid #fadbd8" }}>
            {error}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 1: CONFIGURATION & GENERATOR STUDIO                      */}
        {/* ============================================================ */}
        {mode === "config" && (
          <div className="test-grid-layout">
            <div className="test-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 className="test-section-title">Configure Your Test</h3>
                  <p className="test-section-subtitle">
                    Select a curriculum preset or enter your custom course details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  style={{ background: "none", border: "none", color: "var(--accent, #b87542)", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                >
                  {isCustomMode ? "Use Curated Presets" : "Enter Custom Details"}
                </button>
              </div>

              <form onSubmit={handleGenerateTest}>
                {/* 1. Course */}
                <div className="test-form-group">
                  <label className="test-form-label">1. Course / Academic Program</label>
                  {isCustomMode ? (
                    <input
                      type="text"
                      value={customCourse}
                      onChange={(e) => setCustomCourse(e.target.value)}
                      placeholder="e.g. B.Tech Artificial Intelligence, B.Sc Physics..."
                      className="test-input"
                      required
                    />
                  ) : (
                    <div className="test-preset-chips">
                      {presets.map((p) => (
                        <button
                          key={p.course}
                          type="button"
                          onClick={() => handleCourseChange(p.course)}
                          className={`test-chip ${selectedCourse === p.course ? "selected" : ""}`}
                        >
                          {p.course}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Subject */}
                <div className="test-form-group">
                  <label className="test-form-label">2. Subject</label>
                  {isCustomMode ? (
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="e.g. Operating Systems, Machine Learning..."
                      className="test-input"
                      required
                    />
                  ) : (
                    <div>
                      <select
                        value={selectedSubject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="test-select"
                        style={{ marginBottom: 8 }}
                      >
                        {availableSubjects.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Or override with custom subject name..."
                        className="test-input"
                        style={{ fontSize: 12, padding: "8px 12px" }}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Chapter */}
                <div className="test-form-group">
                  <label className="test-form-label">3. Chapter / Topic Name</label>
                  {isCustomMode ? (
                    <input
                      type="text"
                      value={customChapter}
                      onChange={(e) => setCustomChapter(e.target.value)}
                      placeholder="e.g. Deadlock Detection & Prevention..."
                      className="test-input"
                      required
                    />
                  ) : (
                    <div>
                      <select
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(e.target.value)}
                        className="test-select"
                        style={{ marginBottom: 8 }}
                      >
                        {availableChapters.map((ch) => (
                          <option key={ch} value={ch}>
                            {ch}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={customChapter}
                        onChange={(e) => setCustomChapter(e.target.value)}
                        placeholder="Or override with custom chapter/topic name..."
                        className="test-input"
                        style={{ fontSize: 12, padding: "8px 12px" }}
                      />
                    </div>
                  )}
                </div>

                {/* 4. Parameters */}
                <div className="test-params-row test-form-group">
                  <div>
                    <label className="test-form-label">Questions</label>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="test-select"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="test-form-label">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="test-select"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="test-form-label">Time Limit</label>
                    <select
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="test-select"
                    >
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={0}>Untimed</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="test-primary-btn"
                >
                  {loading ? "Generating Tailored Questions..." : "Generate & Launch Test"}
                </button>
              </form>
            </div>

            {/* Sidebar info */}
            <div>
              <div className="test-card" style={{ marginBottom: 20 }}>
                <p className="test-form-label">HOW IT WORKS</p>
                <h4 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: "6px 0 14px", fontWeight: 400 }}>
                  Pedagogical Test Engine
                </h4>
                <p style={{ fontSize: 13, color: "var(--muted, #6d6860)", lineHeight: 1.6 }}>
                  StudyMate dynamically synthesizes questions tailored to your chapter syllabus. Earn XP points for every correct response, evaluate your weak spots, and review detailed conceptual explanations.
                </p>
              </div>

              <div className="test-card">
                <p className="test-form-label">QUICK TOPICS</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {[
                    "Process Scheduling",
                    "Deadlock Prevention",
                    "Relational Algebra",
                    "Normalization (3NF/BCNF)",
                    "de Broglie Waves",
                    "Eigenvalues & Matrices",
                  ].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        setIsCustomMode(true);
                        setCustomCourse("B.Tech Computer Science / Engineering");
                        setCustomSubject("Core Subject");
                        setCustomChapter(topic);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid var(--line, rgba(23, 22, 20, 0.12))",
                        background: "var(--surface-2, #fbf9f4)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: ACTIVE TEST TAKING                                    */}
        {/* ============================================================ */}
        {mode === "taking" && activeTest && (
          <div className="test-grid-layout">
            <div className="test-card">
              <div className="test-question-header">
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent, #b87542)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Question {currentQIndex + 1} of {activeTest.questions.length}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted, #777)" }}>
                    {activeTest.subject} — {activeTest.chapter}
                  </p>
                </div>
              </div>

              {(() => {
                const currentQ = activeTest.questions[currentQIndex];
                const selectedOpt = userAnswers[String(currentQ.id)];

                return (
                  <div className="test-question-box">
                    <h3 className="test-question-title">{currentQ.question_text}</h3>

                    <div className="test-options-list">
                      {currentQ.options.map((option, idx) => {
                        const isChosen = selectedOpt === option;
                        const letter = String.fromCharCode(65 + idx);

                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectOption(currentQ.id, option)}
                            className={`test-option-item ${isChosen ? "chosen" : ""}`}
                          >
                            <span className="test-option-letter">{letter}</span>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{option}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="test-nav-controls">
                      <button
                        type="button"
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                        className="test-secondary-btn"
                        style={{ opacity: currentQIndex === 0 ? 0.4 : 1 }}
                      >
                        ← Previous
                      </button>

                      {currentQIndex < activeTest.questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQIndex((prev) => Math.min(activeTest.questions.length - 1, prev + 1))}
                          className="test-primary-btn"
                          style={{ width: "auto", padding: "10px 24px" }}
                        >
                          Next Question →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitTest}
                          disabled={loading}
                          className="test-primary-btn"
                          style={{ width: "auto", padding: "10px 24px", background: "#2b7a4b" }}
                        >
                          {loading ? "Submitting..." : "Submit Test"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Question Palette */}
            <div>
              <div className="test-card">
                <p className="test-form-label">QUESTION PALETTE</p>
                <div className="test-palette-grid">
                  {activeTest.questions.map((q, idx) => {
                    const isAnswered = Boolean(userAnswers[String(q.id)]);
                    const isCurrent = currentQIndex === idx;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQIndex(idx)}
                        className={`test-palette-btn ${isCurrent ? "active" : isAnswered ? "answered" : ""}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line, rgba(23, 22, 20, 0.1))", fontSize: 12, color: "var(--muted, #666)" }}>
                  <p>Answered: {Object.keys(userAnswers).length} / {activeTest.questions.length}</p>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitTest}
                  disabled={loading}
                  className="test-primary-btn"
                  style={{ marginTop: 20 }}
                >
                  {loading ? "Grading..." : "Finish & Submit Test"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 3: SCORECARD & STEP-BY-STEP EXPLANATION                  */}
        {/* ============================================================ */}
        {mode === "scorecard" && submissionResult && (
          <div>
            <div className="scorecard-banner">
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--accent, #b87542)" }}>
                  TEST COMPLETED & GRADED
                </p>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 36, margin: "0 0 10px", fontWeight: 400 }}>
                  {submissionResult.percentage >= 80 ? "Outstanding Work! ★" : "Good Attempt! Keep Revising"}
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(245, 242, 235, 0.8)" }}>
                  You earned <strong style={{ color: "#f1c40f" }}>+{submissionResult.xp_awarded} XP</strong> points!
                </p>
              </div>

              <div className="scorecard-score-box">
                <div>
                  <div className="scorecard-metric-val">{submissionResult.percentage}%</div>
                  <div className="scorecard-metric-lbl">Score</div>
                </div>
                <div>
                  <div className="scorecard-metric-val">{submissionResult.score}/{submissionResult.total_marks}</div>
                  <div className="scorecard-metric-lbl">Marks</div>
                </div>
                <div>
                  <div className="scorecard-metric-val">{formatSeconds(submissionResult.time_taken_seconds)}</div>
                  <div className="scorecard-metric-lbl">Time Taken</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 24, margin: 0, fontWeight: 400 }}>
                Question Breakdown & Explanations
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMode("config");
                  setActiveTest(null);
                  setSubmissionResult(null);
                }}
                className="test-primary-btn"
                style={{ width: "auto", padding: "10px 20px" }}
              >
                Take Another Test
              </button>
            </div>

            {/* Questions Review */}
            {submissionResult.answers_review.map((item, idx) => (
              <div key={item.question_id} className="review-item">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent, #b87542)" }}>Q{idx + 1}.</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: item.is_correct ? "#e8f8f0" : "#fdedec",
                    color: item.is_correct ? "#2b7a4b" : "#b03a2e"
                  }}>
                    {item.is_correct ? "Correct (+15 XP)" : "Incorrect"}
                  </span>
                </div>

                <h4 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: "0 0 16px", fontWeight: 400 }}>
                  {item.question_text}
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {item.options.map((opt, oIdx) => {
                    const isCorrect = item.correct_answer === opt;
                    const isUserChoice = item.user_answer === opt;

                    let bg = "var(--surface-2, #fbf9f4)";
                    let borderColor = "var(--line, rgba(23, 22, 20, 0.1))";
                    if (isCorrect) {
                      bg = "#e8f8f0";
                      borderColor = "#2b7a4b";
                    } else if (isUserChoice && !item.is_correct) {
                      bg = "#fdedec";
                      borderColor = "#b03a2e";
                    }

                    return (
                      <div
                        key={oIdx}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: `1px solid ${borderColor}`,
                          background: bg,
                          fontSize: 13,
                          display: "flex",
                          justifyContent: "space-between"
                        }}
                      >
                        <span>{opt}</span>
                        {isCorrect && <strong style={{ color: "#2b7a4b", fontSize: 11 }}>Correct Answer</strong>}
                        {isUserChoice && !isCorrect && <strong style={{ color: "#b03a2e", fontSize: 11 }}>Your Answer</strong>}
                      </div>
                    );
                  })}
                </div>

                {item.explanation && (
                  <div className="review-explanation">
                    <strong>Explanation: </strong>
                    <span>{item.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 4: HISTORY                                              */}
        {/* ============================================================ */}
        {mode === "history" && (
          <div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 24, margin: "0 0 20px", fontWeight: 400 }}>
              Past Tests History
            </h3>

            {loadingHistory ? (
              <p style={{ fontSize: 13, color: "var(--muted, #666)" }}>Loading your test history...</p>
            ) : historyList.length === 0 ? (
              <div className="test-card" style={{ textAlign: "center", padding: 48 }}>
                <p style={{ fontSize: 14, color: "var(--muted, #666)" }}>No test attempts recorded yet.</p>
                <button
                  type="button"
                  onClick={() => setMode("config")}
                  className="test-primary-btn"
                  style={{ width: "auto", margin: "16px auto 0" }}
                >
                  Create Your First Test
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {historyList.map((item) => (
                  <div key={item.id} className="test-card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent, #b87542)", textTransform: "uppercase" }}>
                        {item.difficulty}
                      </span>
                      <strong style={{ fontSize: 14 }}>
                        {item.score} / {item.total_marks} ({item.percentage}%)
                      </strong>
                    </div>

                    <h4 style={{ fontFamily: "Georgia, serif", fontSize: 16, margin: "4px 0", fontWeight: 400 }}>
                      {item.chapter}
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--muted, #666)", margin: "0 0 12px" }}>
                      {item.subject} • {item.course}
                    </p>

                    <div style={{ borderTop: "1px solid var(--line, rgba(23, 22, 20, 0.08))", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted, #888)" }}>
                      <span>{formatSeconds(item.time_taken_seconds)}</span>
                      <span>{item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}
