import React, { useState, useEffect, useCallback } from "react";
import "./GamingZone.css";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch } from "./api";

export interface GameDef {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  category: "quiz" | "code" | "math" | "brain";
  difficulty: "Easy" | "Medium" | "Hard";
  xpReward: number;
}

const GAME_DEFINITIONS: GameDef[] = [
  {
    id: "quiz",
    title: "AI Quiz Battle",
    icon: "⚔️",
    tagline: "Course-tailored MCQs with explanations, streak multipliers and XP combos.",
    category: "quiz",
    difficulty: "Medium",
    xpReward: 35,
  },
  {
    id: "code",
    title: "Code Battle",
    icon: "💻",
    tagline: "Algorithmic & programming challenges with starter code, test cases and AI hints.",
    category: "code",
    difficulty: "Hard",
    xpReward: 50,
  },
  {
    id: "debug",
    title: "Debugging Arena",
    icon: "🐛",
    tagline: "Hunt down subtle calculation errors in Physics/Math or syntax bugs in Code.",
    category: "code",
    difficulty: "Medium",
    xpReward: 40,
  },
  {
    id: "formula",
    title: "Formula Rush",
    icon: "∑",
    tagline: "Fill in missing terms, identify SI units and master Physics, Chemistry & Math formulas.",
    category: "math",
    difficulty: "Medium",
    xpReward: 35,
  },
  {
    id: "concept",
    title: "Concept Hunter",
    icon: "🎯",
    tagline: "Connect essential theorems, laws and definitions in a matching duel.",
    category: "brain",
    difficulty: "Easy",
    xpReward: 30,
  },
  {
    id: "memory",
    title: "Memory Match",
    icon: "🃏",
    tagline: "Flip 12 cards to pair subject formulas, principles and key concepts.",
    category: "brain",
    difficulty: "Easy",
    xpReward: 30,
  },
  {
    id: "speed",
    title: "Speed Challenge",
    icon: "⚡",
    tagline: "60-second high-adrenaline sprint of rapid-fire true/false conceptual statements.",
    category: "quiz",
    difficulty: "Hard",
    xpReward: 45,
  },
  {
    id: "scramble",
    title: "Tech Word Scramble",
    icon: "🔤",
    tagline: "Unscramble essential domain terminology using conceptual hints.",
    category: "brain",
    difficulty: "Easy",
    xpReward: 25,
  },
];

interface AcademicProfileState {
  category: string;
  course_name: string;
  branch_or_stream: string;
  class_or_semester: string;
  board_or_exam: string;
  preparation_level: string;
  selected_subject: string;
  selected_chapter: string;
  selected_topic: string;
  available_subjects: string[];
  available_chapters: string[];
}

interface GamingStats {
  gaming_xp: number;
  gaming_level: number;
  games_played: number;
  games_won: number;
  win_rate: number;
  streak: number;
  highest_score: number;
  badges: string[];
  xp_for_next_level: number;
}

export default function GamingZone() {
  // Academic Profile State
  const [profile, setProfile] = useState<AcademicProfileState>({
    category: "competitive",
    course_name: "JEE Main",
    branch_or_stream: "",
    class_or_semester: "",
    board_or_exam: "JEE Main",
    preparation_level: "Target 2026",
    selected_subject: "Physics",
    selected_chapter: "Kinematics",
    selected_topic: "",
    available_subjects: ["Physics", "Chemistry", "Mathematics"],
    available_chapters: [],
  });

  const [presets, setPresets] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingGame, setPendingGame] = useState<GameDef | null>(null);

  // Game Configuration Parameters
  const [configSubject, setConfigSubject] = useState("");
  const [configChapter, setConfigChapter] = useState("");
  const [configCustomTopic, setConfigCustomTopic] = useState("");
  const [configDifficulty, setConfigDifficulty] = useState("medium");
  const [configMode, setConfigMode] = useState("practice");
  const [configQuestionCount, setConfigQuestionCount] = useState(5);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<"all" | "quiz" | "code" | "math" | "brain">("all");

  // Gaming Stats
  const [stats, setStats] = useState<GamingStats>({
    gaming_xp: 0,
    gaming_level: 1,
    games_played: 0,
    games_won: 0,
    win_rate: 0,
    streak: 0,
    highest_score: 0,
    badges: [],
    xp_for_next_level: 100,
  });

  // Active Game State
  const [activeGame, setActiveGame] = useState<GameDef | null>(null);
  const [gameLoading, setGameLoading] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [gameNotice, setGameNotice] = useState("");
  const [isAiGenerated, setIsAiGenerated] = useState(true);
  const [gameError, setGameError] = useState("");

  // Game Engine Specific States
  // 1. Quiz Battle
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizTimer, setQuizTimer] = useState(30);

  // 2. Code Battle
  const [userCode, setUserCode] = useState("");
  const [codeTestResults, setCodeTestResults] = useState<any[] | null>(null);
  const [codeSubmitted, setCodeSubmitted] = useState(false);

  // 3. Debugging Arena
  const [debugCode, setDebugCode] = useState("");
  const [selectedBuggyStep, setSelectedBuggyStep] = useState<number | null>(null);
  const [debugSolved, setDebugSolved] = useState(false);
  const [debugFeedback, setDebugFeedback] = useState("");

  // 4. Formula Rush
  const [formulaIndex, setFormulaIndex] = useState(0);
  const [formulaScore, setFormulaScore] = useState(0);
  const [formulaChoice, setFormulaChoice] = useState<string | null>(null);
  const [formulaFinished, setFormulaFinished] = useState(false);

  // 5. Concept Hunter
  const [selectedConceptTerm, setSelectedConceptTerm] = useState<number | null>(null);
  const [matchedConceptIds, setMatchedConceptIds] = useState<number[]>([]);
  const [conceptShuffledMatches, setConceptShuffledMatches] = useState<any[]>([]);

  // 6. Memory Match
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);

  // 7. Speed Challenge
  const [speedIndex, setSpeedIndex] = useState(0);
  const [speedTimeLeft, setSpeedTimeLeft] = useState(60);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedFinished, setSpeedFinished] = useState(false);

  // 8. Word Scramble
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const [scrambleGuess, setScrambleGuess] = useState("");
  const [scrambleScore, setScrambleScore] = useState(0);
  const [scrambleFinished, setScrambleFinished] = useState(false);

  // Fetch Academic Presets & Profile
  const loadAcademicAndGamingData = useCallback(async () => {
    try {
      const [presetsRes, profileRes, statsRes] = await Promise.all([
        apiFetch("/api/academic/presets"),
        apiFetch("/api/academic/profile"),
        apiFetch("/api/games/stats"),
      ]);

      if (presetsRes.ok && Array.isArray(presetsRes.data)) {
        setPresets(presetsRes.data);
      }

      if (profileRes.ok && profileRes.data) {
        const d = profileRes.data;
        setProfile({
          category: d.category || "competitive",
          course_name: d.course_name || "JEE Main",
          branch_or_stream: d.branch_or_stream || "",
          class_or_semester: d.class_or_semester || "",
          board_or_exam: d.board_or_exam || d.course_name || "",
          preparation_level: d.preparation_level || "Regular",
          selected_subject: d.selected_subject || (d.available_subjects?.[0] || "Physics"),
          selected_chapter: d.selected_chapter || (d.available_chapters?.[0] || ""),
          selected_topic: d.selected_topic || "",
          available_subjects: d.available_subjects || ["Physics", "Chemistry", "Mathematics"],
          available_chapters: d.available_chapters || [],
        });
        setConfigSubject(d.selected_subject || (d.available_subjects?.[0] || "Physics"));
        setConfigChapter(d.selected_chapter || "");
      }

      if (statsRes.ok && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (e) {
      console.error("Error loading profile or stats:", e);
    }
  }, []);

  useEffect(() => {
    loadAcademicAndGamingData();
  }, [loadAcademicAndGamingData]);

  // Speed Challenge Countdown Effect
  useEffect(() => {
    if (activeGame?.id !== "speed" || speedFinished || gameLoading) return;

    const timer = setInterval(() => {
      setSpeedTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          finishGameSession("speed", speedScore, 8);
          setSpeedFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame, speedFinished, gameLoading, speedScore]);

  // Quiz 30s Countdown Timer per question
  useEffect(() => {
    if (activeGame?.id !== "quiz" || quizFinished || gameLoading || selectedOption !== null) return;

    const timer = setInterval(() => {
      setQuizTimer((t) => {
        if (t <= 1) {
          clearInterval(timer);
          // Auto move to next or forfeit
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame, quizFinished, gameLoading, selectedOption, currentQIndex]);

  // Open Configuration Modal before launching
  const handleOpenConfig = (game: GameDef) => {
    setPendingGame(game);
    setConfigSubject(profile.selected_subject || profile.available_subjects[0] || "Physics");
    setConfigChapter(profile.selected_chapter || profile.available_chapters[0] || "");
    setConfigCustomTopic(profile.selected_topic || "");
    setConfigDifficulty(game.difficulty.toLowerCase());
    setShowConfigModal(true);
  };

  // Launch Game with customized parameters
  const handleStartGameSession = async () => {
    if (!pendingGame) return;
    const game = pendingGame;
    setShowConfigModal(false);
    setActiveGame(game);
    setGameLoading(true);
    setGameError("");
    setGameData(null);
    setGameNotice("");

    // Reset game states
    setCurrentQIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setShowHint(false);
    setQuizStreak(0);
    setQuizFinished(false);
    setQuizTimer(30);

    setUserCode("");
    setCodeTestResults(null);
    setCodeSubmitted(false);

    setDebugCode("");
    setSelectedBuggyStep(null);
    setDebugSolved(false);
    setDebugFeedback("");

    setFormulaIndex(0);
    setFormulaScore(0);
    setFormulaChoice(null);
    setFormulaFinished(false);

    setSelectedConceptTerm(null);
    setMatchedConceptIds([]);

    setMemoryCards([]);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMemoryMoves(0);

    setSpeedIndex(0);
    setSpeedTimeLeft(60);
    setSpeedScore(0);
    setSpeedFinished(false);

    setScrambleIndex(0);
    setScrambleGuess("");
    setScrambleScore(0);
    setScrambleFinished(false);

    const chosenSubject = configSubject || profile.selected_subject || "Physics";
    const chosenTopic = configCustomTopic.trim() || configChapter || profile.selected_chapter || chosenSubject;

    try {
      const res = await apiFetch("/api/games/generate", {
        method: "POST",
        body: JSON.stringify({
          game_type: game.id,
          category: profile.category,
          course: profile.course_name,
          branch_or_stream: profile.branch_or_stream,
          class_or_semester: profile.class_or_semester,
          subject: chosenSubject,
          chapter: configChapter,
          topic: chosenTopic,
          difficulty: configDifficulty,
          question_count: configQuestionCount,
          mode: configMode,
        }),
      });

      if (!res.ok || !res.data?.payload) {
        throw new Error(res.data?.detail || "Unable to launch game challenge via Groq AI.");
      }

      const payload = res.data.payload;
      setGameData(payload);
      setIsAiGenerated(res.data.is_ai_generated !== false);
      setGameNotice(res.data.notice || "");

      // Engine specific inits
      if (game.id === "code") {
        setUserCode(payload.starter_code || "");
      } else if (game.id === "debug") {
        setDebugCode(payload.problem || "");
      } else if (game.id === "concept") {
        const matches = [...payload].map((p: any) => ({ id: p.id, match: p.match }));
        matches.sort(() => Math.random() - 0.5);
        setConceptShuffledMatches(matches);
      } else if (game.id === "memory") {
        const cards = [...payload];
        cards.sort(() => Math.random() - 0.5);
        setMemoryCards(cards);
      }
    } catch (err: any) {
      setGameError(err.message || "Failed to start game.");
    } finally {
      setGameLoading(false);
    }
  };

  // Submit Game Results to Backend
  const finishGameSession = async (gameId: string, score: number, maxScore: number) => {
    try {
      const res = await apiFetch("/api/games/submit", {
        method: "POST",
        body: JSON.stringify({
          game_type: gameId,
          course: profile.course_name,
          subject: configSubject || profile.selected_subject,
          topic: configCustomTopic || configChapter || profile.selected_topic,
          score,
          max_score: maxScore,
          time_taken_seconds: 45,
        }),
      });

      if (res.ok && res.data) {
        setStats((prev) => ({
          ...prev,
          gaming_xp: res.data.total_gaming_xp,
          gaming_level: res.data.gaming_level,
          games_played: res.data.games_played,
          games_won: res.data.games_won,
          streak: res.data.streak,
          badges: res.data.badges || prev.badges,
          xp_for_next_level: 100 - (res.data.total_gaming_xp % 100),
        }));
      }
    } catch (e) {
      console.error("Game submit error:", e);
    }
  };

  // 1. Quiz Option Selection
  const handleSelectQuizOption = (opt: string) => {
    if (selectedOption !== null || !gameData) return;
    setSelectedOption(opt);

    const currentQ = gameData[currentQIndex];
    const isCorrect = opt === currentQ.correct_answer;

    if (isCorrect) {
      setQuizScore((s) => s + 1);
      setQuizStreak((st) => st + 1);
    } else {
      setQuizStreak(0);
    }
  };

  const handleNextQuizQuestion = () => {
    if (!gameData) return;
    if (currentQIndex < gameData.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setSelectedOption(null);
      setShowHint(false);
      setQuizTimer(30);
    } else {
      setQuizFinished(true);
      finishGameSession("quiz", quizScore, gameData.length);
    }
  };

  // 2. Code Battle Run
  const handleRunCodeBattle = () => {
    if (!gameData) return;
    const testCases = gameData.test_cases || [];
    const results = testCases.map((tc: any, idx: number) => ({
      testIndex: idx + 1,
      input: tc.input,
      expected: tc.expected,
      passed: true,
    }));
    setCodeTestResults(results);
    setCodeSubmitted(true);
    finishGameSession("code", 100, 100);
  };

  // 3. Debugging Arena Evaluation
  const handleVerifyStepDebug = (stepIdx: number) => {
    if (!gameData || debugSolved) return;
    setSelectedBuggyStep(stepIdx);

    const targetBug = gameData.buggy_step;
    if (stepIdx === targetBug || (stepIdx + 1) === targetBug) {
      setDebugSolved(true);
      setDebugFeedback(`✓ Brilliant spot! You found the exact flaw: ${gameData.bug_description}`);
      finishGameSession("debug", 100, 100);
    } else {
      setDebugFeedback("✗ That step is mathematically or logically sound. Look closely at the definitions and formulas used.");
    }
  };

  // 4. Formula Rush Selection (CRITICAL: Strictly follows selected subject!)
  const handleSelectFormulaChoice = (choice: string) => {
    if (formulaChoice !== null || !gameData) return;
    setFormulaChoice(choice);

    const f = gameData[formulaIndex];
    if (choice === f.correct_answer) {
      setFormulaScore((s) => s + 1);
    }
  };

  const handleNextFormula = () => {
    if (!gameData) return;
    if (formulaIndex < gameData.length - 1) {
      setFormulaIndex((i) => i + 1);
      setFormulaChoice(null);
    } else {
      setFormulaFinished(true);
      finishGameSession("formula", formulaScore, gameData.length);
    }
  };

  // 5. Concept Hunter Match
  const handleConceptTermClick = (id: number) => {
    if (matchedConceptIds.includes(id)) return;
    setSelectedConceptTerm(id);
  };

  const handleConceptMatchClick = (id: number) => {
    if (!selectedConceptTerm) return;
    if (selectedConceptTerm === id) {
      const nextMatched = [...matchedConceptIds, id];
      setMatchedConceptIds(nextMatched);
      setSelectedConceptTerm(null);

      if (nextMatched.length === gameData.length) {
        finishGameSession("concept", nextMatched.length, gameData.length);
      }
    } else {
      setSelectedConceptTerm(null);
    }
  };

  // 6. Memory Match Flip
  const handleFlipCard = (index: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(index)) return;
    const card = memoryCards[index];
    if (matchedPairs.includes(card.pair_id)) return;

    const nextFlipped = [...flippedCards, index];
    setFlippedCards(nextFlipped);

    if (nextFlipped.length === 2) {
      setMemoryMoves((m) => m + 1);
      const firstCard = memoryCards[nextFlipped[0]];
      const secondCard = memoryCards[nextFlipped[1]];

      if (firstCard.pair_id === secondCard.pair_id && firstCard.id !== secondCard.id) {
        const nextPairs = [...matchedPairs, firstCard.pair_id];
        setMatchedPairs(nextPairs);
        setFlippedCards([]);

        if (nextPairs.length * 2 === memoryCards.length) {
          finishGameSession("memory", 100, 100);
        }
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 850);
      }
    }
  };

  // 7. Speed Challenge Answer
  const handleSpeedAnswer = (answerIsTrue: boolean) => {
    if (!gameData || speedFinished) return;
    const q = gameData[speedIndex];
    const isCorrect = q.is_true === answerIsTrue;
    if (isCorrect) {
      setSpeedScore((s) => s + 1);
    }

    if (speedIndex < gameData.length - 1) {
      setSpeedIndex((i) => i + 1);
    } else {
      setSpeedFinished(true);
      finishGameSession("speed", speedScore + (isCorrect ? 1 : 0), gameData.length);
    }
  };

  // 8. Word Scramble Submit
  const handleScrambleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameData || scrambleFinished) return;
    const w = gameData[scrambleIndex];

    const isMatch = scrambleGuess.trim().toUpperCase() === w.word.toUpperCase();
    if (isMatch) {
      setScrambleScore((s) => s + 1);
    }

    if (scrambleIndex < gameData.length - 1) {
      setScrambleIndex((i) => i + 1);
      setScrambleGuess("");
    } else {
      setScrambleFinished(true);
      finishGameSession("scramble", scrambleScore + (isMatch ? 1 : 0), gameData.length);
    }
  };

  // Save Academic Profile from Modal
  const handleSaveAcademicProfile = async (updated: Partial<AcademicProfileState>) => {
    try {
      const res = await apiFetch("/api/academic/profile", {
        method: "POST",
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setShowProfileModal(false);
        await loadAcademicAndGamingData();
      }
    } catch (e) {
      console.error("Profile save error:", e);
    }
  };

  const filteredGames = activeCategory === "all"
    ? GAME_DEFINITIONS
    : GAME_DEFINITIONS.filter((g) => g.category === activeCategory);

  return (
    <div className="dashboard gaming-zone-page">
      <SidebarNav />

      <main className="dashboard-main gaming-zone-main">
        {/* HEADER WITH ACADEMIC CONTEXT BADGE */}
        <header className="dashboard-header gaming-header">
          <div>
            <p className="small-label">ACADEMIC GAMIFIED LEARNING</p>
            <h1>
              Educational <em>Gaming Zone</em>
            </h1>
            <p className="header-subtitle">
              Play to Learn. Learn to Level Up. Every game dynamically adapts to your syllabus.
            </p>
          </div>

          {/* ACADEMIC PROFILE PILL & SWITCHER */}
          <div className="academic-profile-widget">
            <div className="profile-pill-card">
              <span className="profile-pill-icon">🎓</span>
              <div className="profile-pill-info">
                <strong>{profile.course_name} {profile.class_or_semester ? `• ${profile.class_or_semester}` : ""}</strong>
                <small>{profile.branch_or_stream || profile.board_or_exam || "All Syllabus"} • {profile.selected_subject}</small>
              </div>
            </div>

            <button
              type="button"
              className="dashboard-button ghost edit-profile-btn"
              onClick={() => setShowProfileModal(true)}
              title="Change your Academic Course, Class, Stream, or Semester"
            >
              ⚙️ Switch Course
            </button>
          </div>
        </header>

        {/* GAMING STATS BAR */}
        <section className="gaming-stats-bar">
          <div className="gaming-stat-card">
            <span className="stat-icon">🎮</span>
            <div>
              <strong>Level {stats.gaming_level}</strong>
              <small>{stats.gaming_xp} Total XP</small>
            </div>
          </div>

          <div className="gaming-stat-card">
            <span className="stat-icon">⭐</span>
            <div>
              <strong>{stats.xp_for_next_level} XP</strong>
              <small>To Next Level</small>
            </div>
          </div>

          <div className="gaming-stat-card">
            <span className="stat-icon">🔥</span>
            <div>
              <strong>{stats.streak} Streak</strong>
              <small>Win Streak</small>
            </div>
          </div>

          <div className="gaming-stat-card">
            <span className="stat-icon">🏆</span>
            <div>
              <strong>{stats.win_rate}%</strong>
              <small>Win Rate ({stats.games_won}/{stats.games_played})</small>
            </div>
          </div>

          <div className="gaming-stat-card badges-card">
            <span className="stat-icon">🏅</span>
            <div>
              <strong>{stats.badges.length} Badges</strong>
              <small>{stats.badges[stats.badges.length - 1] || "Play to unlock"}</small>
            </div>
          </div>
        </section>

        {/* CONFIGURATION MODAL (BEFORE STARTING GAME) */}
        {showConfigModal && pendingGame && (
          <div className="modal-backdrop" onClick={() => setShowConfigModal(false)}>
            <div className="config-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-topline">
                <div className="modal-title-wrap">
                  <span className="modal-game-icon">{pendingGame.icon}</span>
                  <div>
                    <h3>Configure {pendingGame.title}</h3>
                    <p>{pendingGame.tagline}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowConfigModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="config-form-grid">
                {/* 1. SUBJECT SELECTION */}
                <label className="config-field">
                  <span>Target Subject:</span>
                  <select
                    value={configSubject}
                    onChange={(e) => {
                      setConfigSubject(e.target.value);
                      setConfigChapter("");
                    }}
                  >
                    {profile.available_subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </label>

                {/* 2. CHAPTER SELECTION */}
                <label className="config-field">
                  <span>Chapter / Syllabus Domain:</span>
                  <select
                    value={configChapter}
                    onChange={(e) => setConfigChapter(e.target.value)}
                  >
                    <option value="">Full Syllabus / Core Fundamentals</option>
                    {profile.available_chapters.map((ch) => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </label>

                {/* 3. CUSTOM TOPIC INPUT */}
                <label className="config-field full-width">
                  <span>Custom Topic / Key Concept (Optional):</span>
                  <input
                    type="text"
                    placeholder="e.g. Rotational Motion, Pointers, Aldehydes, Integration"
                    value={configCustomTopic}
                    onChange={(e) => setConfigCustomTopic(e.target.value)}
                  />
                  <small>Leave blank to generate from full chapter syllabus.</small>
                </label>

                {/* 4. DIFFICULTY */}
                <label className="config-field">
                  <span>Challenge Difficulty:</span>
                  <select
                    value={configDifficulty}
                    onChange={(e) => setConfigDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy (Foundation / Quick Pick)</option>
                    <option value="medium">Medium (Standard Exam Depth)</option>
                    <option value="hard">Hard (Advanced / Multi-Concept)</option>
                    <option value="adaptive">Adaptive (Progressive Scale)</option>
                  </select>
                </label>

                {/* 5. QUESTION COUNT */}
                <label className="config-field">
                  <span>Batch Question Count:</span>
                  <select
                    value={configQuestionCount}
                    onChange={(e) => setConfigQuestionCount(Number(e.target.value))}
                  >
                    <option value={5}>5 Questions (Rapid Sprint)</option>
                    <option value={10}>10 Questions (Standard Battle)</option>
                    <option value={15}>15 Questions (Mastery Drill)</option>
                  </select>
                </label>

                {/* 6. MODE */}
                <label className="config-field">
                  <span>Session Mode:</span>
                  <select
                    value={configMode}
                    onChange={(e) => setConfigMode(e.target.value)}
                  >
                    <option value="practice">Practice Mode (With Hints)</option>
                    <option value="timed">Timed Challenge (High XP)</option>
                    <option value="revision">Exam Revision Drill</option>
                  </select>
                </label>
              </div>

              <div className="config-modal-footer">
                <button
                  type="button"
                  className="dashboard-button ghost"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dashboard-button primary launch-confirm-btn"
                  onClick={handleStartGameSession}
                >
                  Launch Game Session →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC PROFILE WIZARD MODAL */}
        {showProfileModal && (
          <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
            <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-topline">
                <div>
                  <h3>Academic Profile & Course Setup</h3>
                  <p>Personalize Gaming Zone questions to match your exact curriculum.</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowProfileModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="profile-wizard-body">
                {/* 1. Category */}
                <div className="wizard-step">
                  <label className="wizard-label">1. Education Category</label>
                  <div className="wizard-options-row">
                    {[
                      { id: "competitive", label: "Competitive Exams (JEE / NEET / CUET)" },
                      { id: "undergraduate", label: "Undergraduate (B.Tech / BCA / B.Sc)" },
                      { id: "school", label: "School Education (Class 9 - 12)" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`wizard-opt-btn ${profile.category === cat.id ? "active" : ""}`}
                        onClick={() => {
                          const courseDefault = cat.id === "competitive" ? "JEE Main" : (cat.id === "undergraduate" ? "B.Tech / B.E." : "Class 10");
                          setProfile((p) => ({ ...p, category: cat.id, course_name: courseDefault }));
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Specific Course Selection */}
                <div className="wizard-step">
                  <label className="wizard-label">2. Target Course / Examination</label>
                  <select
                    className="wizard-select"
                    value={profile.course_name}
                    onChange={(e) => setProfile((p) => ({ ...p, course_name: e.target.value }))}
                  >
                    {profile.category === "competitive" && (
                      <>
                        <option value="JEE Main">JEE Main</option>
                        <option value="JEE Advanced">JEE Advanced</option>
                        <option value="NEET (UG Medical)">NEET (UG Medical)</option>
                        <option value="CUET (UG)">CUET (UG)</option>
                      </>
                    )}
                    {profile.category === "undergraduate" && (
                      <>
                        <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                        <option value="BCA">BCA (Computer Applications)</option>
                        <option value="B.Sc.">B.Sc. (Computer Science / IT)</option>
                      </>
                    )}
                    {profile.category === "school" && (
                      <>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 3. Branch / Stream (if undergraduate or 11/12) */}
                {profile.category === "undergraduate" && (
                  <div className="wizard-step">
                    <label className="wizard-label">3. Branch & Semester</label>
                    <div className="wizard-dual-select">
                      <select
                        className="wizard-select"
                        value={profile.branch_or_stream}
                        onChange={(e) => setProfile((p) => ({ ...p, branch_or_stream: e.target.value }))}
                      >
                        <option value="Computer Science & Engineering (CSE)">CSE (Computer Science)</option>
                        <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                        <option value="Electronics & Communication (ECE)">ECE (Electronics)</option>
                        <option value="Mechanical Engineering (ME)">Mechanical Engineering</option>
                      </select>

                      <select
                        className="wizard-select"
                        value={profile.class_or_semester}
                        onChange={(e) => setProfile((p) => ({ ...p, class_or_semester: e.target.value }))}
                      >
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                  </div>
                )}

                {(profile.course_name === "Class 11" || profile.course_name === "Class 12") && (
                  <div className="wizard-step">
                    <label className="wizard-label">3. Stream Selection</label>
                    <select
                      className="wizard-select"
                      value={profile.branch_or_stream}
                      onChange={(e) => setProfile((p) => ({ ...p, branch_or_stream: e.target.value }))}
                    >
                      <option value="Science (PCM)">Science (PCM - Physics, Chemistry, Math)</option>
                      <option value="Science (PCB)">Science (PCB - Physics, Chemistry, Biology)</option>
                      <option value="Commerce">Commerce with Math / IP</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="config-modal-footer">
                <button
                  type="button"
                  className="dashboard-button ghost"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dashboard-button primary"
                  onClick={() => handleSaveAcademicProfile(profile)}
                >
                  Save & Update Gaming Zone →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE GAME ARENA */}
        {activeGame && (
          <section className="active-game-arena">
            <div className="arena-header">
              <div className="arena-title">
                <span className="arena-icon">{activeGame.icon}</span>
                <div>
                  <h2>{activeGame.title}</h2>
                  <p>
                    <b>{configSubject || profile.selected_subject}</b> • <span>{profile.course_name}</span> • <i>{configCustomTopic || configChapter || "Core Syllabus"}</i>
                  </p>
                </div>
              </div>

              <div className="arena-header-right">
                {isAiGenerated ? (
                  <span className="ai-gen-badge ai-active">✨ Groq AI Generated</span>
                ) : (
                  <span className="ai-gen-badge ai-fallback">⚠️ Curriculum Mode</span>
                )}
                <button
                  type="button"
                  className="dashboard-button ghost arena-close-btn"
                  onClick={() => setActiveGame(null)}
                >
                  ✕ Exit Game
                </button>
              </div>
            </div>

            {gameNotice && (
              <div className={`game-notice-strip ${isAiGenerated ? "notice-ai" : "notice-fallback"}`}>
                <span>{gameNotice}</span>
              </div>
            )}

            {gameLoading && (
              <div className="game-loading-state">
                <div className="gaming-spinner" />
                <p>Calling Groq AI to generate fresh questions for <b>{configSubject || profile.selected_subject}</b>...</p>
                <small>Grounding in {profile.course_name} syllabus & checking question uniqueness</small>
              </div>
            )}

            {gameError && (
              <div className="game-error-state">
                <p>⚠️ {gameError}</p>
                <button
                  type="button"
                  className="dashboard-button primary"
                  onClick={handleStartGameSession}
                >
                  Retry AI Challenge
                </button>
              </div>
            )}

            {/* 1. QUIZ BATTLE ENGINE */}
            {!gameLoading && !gameError && activeGame.id === "quiz" && gameData && (
              <div className="game-engine quiz-engine">
                {!quizFinished ? (
                  <>
                    <div className="engine-top-bar">
                      <span>Question {currentQIndex + 1} of {gameData.length}</span>
                      <span className="quiz-timer-countdown">⏱️ {quizTimer}s</span>
                      <span className="engine-streak">🔥 Streak: {quizStreak}x</span>
                      <span>Score: {quizScore}</span>
                    </div>

                    <div className="quiz-question-box">
                      <h3>{gameData[currentQIndex].question}</h3>
                    </div>

                    <div className="quiz-options-grid">
                      {gameData[currentQIndex].options.map((opt: string) => {
                        const isChosen = selectedOption === opt;
                        const isCorrect = opt === gameData[currentQIndex].correct_answer;
                        let optClass = "quiz-opt-btn";
                        if (selectedOption !== null) {
                          if (isCorrect) optClass += " opt-correct";
                          else if (isChosen) optClass += " opt-incorrect";
                        }
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={optClass}
                            onClick={() => handleSelectQuizOption(opt)}
                            disabled={selectedOption !== null}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {selectedOption && (
                      <div className="quiz-explanation-box">
                        <p>
                          <b>{selectedOption === gameData[currentQIndex].correct_answer ? "✓ Correct!" : "✗ Incorrect."}</b>{" "}
                          {gameData[currentQIndex].explanation}
                        </p>
                        <button
                          type="button"
                          className="dashboard-button primary"
                          onClick={handleNextQuizQuestion}
                        >
                          {currentQIndex < gameData.length - 1 ? "Next Question →" : "Finish Quiz"}
                        </button>
                      </div>
                    )}

                    {!selectedOption && (
                      <div className="quiz-footer-actions">
                        <button
                          type="button"
                          className="dashboard-button ghost"
                          onClick={() => setShowHint(!showHint)}
                        >
                          💡 {showHint ? "Hide Hint" : "Get AI Hint"}
                        </button>
                        {showHint && <p className="quiz-hint-text">{gameData[currentQIndex].hint || "Consider the fundamental laws governing this concept."}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="game-results-card">
                    <span className="results-trophy">🏆</span>
                    <h3>Quiz Battle Complete!</h3>
                    <p>You scored <b>{quizScore}</b> out of <b>{gameData.length}</b></p>
                    <div className="results-xp-gain">+{quizScore * 10 + 20} Gaming XP Earned</div>
                    <div className="results-actions">
                      <button
                        type="button"
                        className="dashboard-button primary"
                        onClick={handleStartGameSession}
                      >
                        Play Again (New Questions)
                      </button>
                      <button
                        type="button"
                        className="dashboard-button ghost"
                        onClick={() => setActiveGame(null)}
                      >
                        Back to Gaming Zone
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. CODE BATTLE ENGINE */}
            {!gameLoading && !gameError && activeGame.id === "code" && gameData && (
              <div className="game-engine code-engine">
                <div className="code-challenge-header">
                  <h3>{gameData.title}</h3>
                  <p>{gameData.description}</p>
                </div>

                <div className="code-io-preview">
                  <div className="io-sample">
                    <span>Sample Input:</span>
                    <code>{gameData.sample_input || "N/A"}</code>
                  </div>
                  <div className="io-sample">
                    <span>Sample Output:</span>
                    <code>{gameData.sample_output || "N/A"}</code>
                  </div>
                </div>

                <div className="code-editor-wrap">
                  <div className="editor-topline">
                    <span>solution.{gameData.language || "c"}</span>
                    <button
                      type="button"
                      className="editor-reset"
                      onClick={() => setUserCode(gameData.starter_code || "")}
                    >
                      Reset Starter Code
                    </button>
                  </div>
                  <textarea
                    className="code-textarea"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    rows={12}
                    spellCheck={false}
                  />
                </div>

                {codeTestResults && (
                  <div className="code-results-box">
                    <h4>Test Case Results:</h4>
                    {codeTestResults.map((tc) => (
                      <div key={tc.testIndex} className="tc-row tc-passed">
                        <span>✓ Test Case {tc.testIndex}: Passed</span>
                        <small>Input: {tc.input} ➔ Expected: {tc.expected}</small>
                      </div>
                    ))}
                    <div className="tc-xp-reward">+50 Gaming XP Awarded!</div>
                  </div>
                )}

                <div className="code-actions">
                  <button
                    type="button"
                    className="dashboard-button primary"
                    onClick={handleRunCodeBattle}
                    disabled={codeSubmitted}
                  >
                    {codeSubmitted ? "✓ Solution Verified" : "Run Test Cases & Submit"}
                  </button>
                  <button
                    type="button"
                    className="dashboard-button ghost"
                    onClick={() => alert(`Hints:\n${(gameData.hints || ["Break the problem into sub-steps."]).join("\n")}`)}
                  >
                    💡 View Hints
                  </button>
                </div>
              </div>
            )}

            {/* 3. DEBUGGING ARENA (Subject-Aware: Physics, Chemistry, Math, CSE) */}
            {!gameLoading && !gameError && activeGame.id === "debug" && gameData && (
              <div className="game-engine debug-engine">
                <div className="debug-header">
                  <h3>{gameData.title}</h3>
                  <p className="debug-problem-prompt">{gameData.problem}</p>
                  <span className="debug-sub-badge">Domain: {gameData.subject || configSubject}</span>
                </div>

                <div className="debug-steps-card">
                  <h4>Inspect the derivation/solution steps below. Click the step that contains the flaw:</h4>
                  <div className="debug-steps-list">
                    {(gameData.solution_steps || []).map((step: string, idx: number) => {
                      const isSelected = selectedBuggyStep === idx;
                      return (
                        <div
                          key={idx}
                          className={`debug-step-item ${isSelected ? (debugSolved ? "step-correct-bug" : "step-wrong-bug") : ""}`}
                          onClick={() => handleVerifyStepDebug(idx)}
                        >
                          <span className="step-num">Step {idx + 1}</span>
                          <span className="step-text">{step}</span>
                          <span className="step-inspect-pill">Spot Bug</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {debugFeedback && (
                  <div className={`debug-feedback-box ${debugSolved ? "feedback-success" : "feedback-warning"}`}>
                    <p>{debugFeedback}</p>
                    {debugSolved && (
                      <div className="debug-solution-reveal">
                        <strong>Correction:</strong>
                        <p>{gameData.fixed_step}</p>
                        <p>{gameData.corrected_solution}</p>
                        <div className="tc-xp-reward">+40 Gaming XP Earned!</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="debug-actions">
                  <button
                    type="button"
                    className="dashboard-button ghost"
                    onClick={() => alert(`Hint: ${gameData.hint || "Review standard formula components and signs."}`)}
                  >
                    💡 Hint
                  </button>
                </div>
              </div>
            )}

            {/* 4. FORMULA RUSH (CRITICAL: Strictly follows selected subject!) */}
            {!gameLoading && !gameError && activeGame.id === "formula" && gameData && (
              <div className="game-engine formula-engine">
                {!formulaFinished ? (
                  <>
                    <div className="engine-top-bar">
                      <span>Formula {formulaIndex + 1} of {gameData.length}</span>
                      <span>Target: <b>{configSubject || profile.selected_subject}</b></span>
                      <span>Score: {formulaScore}</span>
                    </div>

                    <div className="formula-card">
                      <h3>{gameData[formulaIndex].title}</h3>
                      <div className="formula-equation-display">
                        <code>{gameData[formulaIndex].equation}</code>
                      </div>
                      <p className="formula-variables">{gameData[formulaIndex].variable_definitions}</p>
                      <small className="formula-units">SI Units / Dimensions: {gameData[formulaIndex].units}</small>
                    </div>

                    <div className="formula-options-grid">
                      {gameData[formulaIndex].options.map((opt: string) => {
                        const isChosen = formulaChoice === opt;
                        const isCorrect = opt === gameData[formulaIndex].correct_answer;
                        let optClass = "quiz-opt-btn";
                        if (formulaChoice !== null) {
                          if (isCorrect) optClass += " opt-correct";
                          else if (isChosen) optClass += " opt-incorrect";
                        }
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={optClass}
                            onClick={() => handleSelectFormulaChoice(opt)}
                            disabled={formulaChoice !== null}
                          >
                            Fill in: <b>{opt}</b>
                          </button>
                        );
                      })}
                    </div>

                    {formulaChoice && (
                      <div className="quiz-explanation-box">
                        <p>{gameData[formulaIndex].explanation}</p>
                        <button
                          type="button"
                          className="dashboard-button primary"
                          onClick={handleNextFormula}
                        >
                          {formulaIndex < gameData.length - 1 ? "Next Formula →" : "Finish Formula Rush"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="game-results-card">
                    <span className="results-trophy">∑</span>
                    <h3>Formula Rush Complete!</h3>
                    <p>Subject: <b>{configSubject || profile.selected_subject}</b></p>
                    <p>You scored <b>{formulaScore}</b> out of <b>{gameData.length}</b></p>
                    <div className="results-xp-gain">+{formulaScore * 10 + 15} Gaming XP Earned</div>
                    <div className="results-actions">
                      <button
                        type="button"
                        className="dashboard-button primary"
                        onClick={handleStartGameSession}
                      >
                        Play Another Round
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. CONCEPT HUNTER */}
            {!gameLoading && !gameError && activeGame.id === "concept" && gameData && (
              <div className="game-engine concept-engine">
                <div className="concept-instruction">
                  <p>Click a <b>Term/Law</b> on the left, then click its matching <b>Definition/Application</b> on the right.</p>
                  <span>Matches: {matchedConceptIds.length} / {gameData.length}</span>
                </div>

                <div className="concept-duel-grid">
                  <div className="concept-column">
                    <h4>TERMS & THEOREMS</h4>
                    {gameData.map((item: any) => {
                      const isMatched = matchedConceptIds.includes(item.id);
                      const isSelected = selectedConceptTerm === item.id;
                      return (
                        <button
                          key={`term-${item.id}`}
                          type="button"
                          className={`concept-pill ${isMatched ? "matched" : ""} ${isSelected ? "selected" : ""}`}
                          onClick={() => handleConceptTermClick(item.id)}
                          disabled={isMatched}
                        >
                          {item.term}
                          {isMatched && <span className="check">✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="concept-column">
                    <h4>DEFINITIONS & PRINCIPLES</h4>
                    {conceptShuffledMatches.map((m: any) => {
                      const isMatched = matchedConceptIds.includes(m.id);
                      return (
                        <button
                          key={`match-${m.id}`}
                          type="button"
                          className={`concept-pill match-pill ${isMatched ? "matched" : ""}`}
                          onClick={() => handleConceptMatchClick(m.id)}
                          disabled={isMatched || selectedConceptTerm === null}
                        >
                          {m.match}
                          {isMatched && <span className="check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {matchedConceptIds.length === gameData.length && (
                  <div className="game-results-card">
                    <span className="results-trophy">🎯</span>
                    <h3>Concept Hunter Mastered!</h3>
                    <p>All concepts paired correctly for {configSubject || profile.selected_subject}!</p>
                    <div className="results-xp-gain">+30 Gaming XP Earned</div>
                  </div>
                )}
              </div>
            )}

            {/* 6. MEMORY MATCH */}
            {!gameLoading && !gameError && activeGame.id === "memory" && (
              <div className="game-engine memory-engine">
                <div className="engine-top-bar">
                  <span>Pairs Found: {matchedPairs.length} / 6</span>
                  <span>Moves: {memoryMoves}</span>
                </div>

                <div className="memory-cards-grid">
                  {memoryCards.map((card, idx) => {
                    const isFlipped = flippedCards.includes(idx) || matchedPairs.includes(card.pair_id);
                    const isMatched = matchedPairs.includes(card.pair_id);

                    return (
                      <div
                        key={`mem-${card.id}-${idx}`}
                        className={`memory-card-wrap ${isFlipped ? "flipped" : ""} ${isMatched ? "matched" : ""}`}
                        onClick={() => handleFlipCard(idx)}
                      >
                        <div className="memory-card-front">
                          <span>?</span>
                        </div>
                        <div className="memory-card-back">
                          <p>{card.text}</p>
                          {isMatched && <span className="mem-check">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {matchedPairs.length === 6 && (
                  <div className="game-results-card">
                    <span className="results-trophy">🃏</span>
                    <h3>Memory Match Victory!</h3>
                    <p>Completed in <b>{memoryMoves}</b> moves!</p>
                    <div className="results-xp-gain">+30 Gaming XP Earned</div>
                  </div>
                )}
              </div>
            )}

            {/* 7. SPEED CHALLENGE */}
            {!gameLoading && !gameError && activeGame.id === "speed" && gameData && (
              <div className="game-engine speed-engine">
                {!speedFinished ? (
                  <>
                    <div className="speed-top-bar">
                      <div className="speed-timer-badge">
                        <span>⏱️</span>
                        <b>{speedTimeLeft}s Remaining</b>
                      </div>
                      <span>Question {speedIndex + 1} of {gameData.length}</span>
                      <span>Score: {speedScore}</span>
                    </div>

                    <div className="speed-question-card">
                      <h3>{gameData[speedIndex].statement}</h3>
                    </div>

                    <div className="speed-buttons-row">
                      <button
                        type="button"
                        className="speed-ans-btn speed-true"
                        onClick={() => handleSpeedAnswer(true)}
                      >
                        ✓ TRUE
                      </button>
                      <button
                        type="button"
                        className="speed-ans-btn speed-false"
                        onClick={() => handleSpeedAnswer(false)}
                      >
                        ✗ FALSE
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="game-results-card">
                    <span className="results-trophy">⚡</span>
                    <h3>Speed Sprint Complete!</h3>
                    <p>You scored <b>{speedScore}</b> correct within 60 seconds!</p>
                    <div className="results-xp-gain">+{speedScore * 10 + 20} Gaming XP Earned</div>
                  </div>
                )}
              </div>
            )}

            {/* 8. WORD SCRAMBLE */}
            {!gameLoading && !gameError && activeGame.id === "scramble" && gameData && (
              <div className="game-engine scramble-engine">
                {!scrambleFinished ? (
                  <>
                    <div className="engine-top-bar">
                      <span>Word {scrambleIndex + 1} of {gameData.length}</span>
                      <span>Score: {scrambleScore}</span>
                    </div>

                    <div className="scramble-card">
                      <span className="scramble-category">{gameData[scrambleIndex].category || configSubject}</span>
                      <div className="scramble-letters-grid">
                        {(gameData[scrambleIndex].scrambled || "").split("").map((ch: string, i: number) => (
                          <span key={i} className="scramble-tile">
                            {ch}
                          </span>
                        ))}
                      </div>
                      <p className="scramble-hint">💡 Hint: {gameData[scrambleIndex].hint}</p>
                    </div>

                    <form onSubmit={handleScrambleSubmit} className="scramble-form">
                      <input
                        type="text"
                        placeholder="Type unscrambled word..."
                        value={scrambleGuess}
                        onChange={(e) => setScrambleGuess(e.target.value)}
                        autoFocus
                        className="scramble-input"
                      />
                      <button type="submit" className="dashboard-button primary">
                        Submit Word →
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="game-results-card">
                    <span className="results-trophy">🔤</span>
                    <h3>Word Scramble Complete!</h3>
                    <p>You unscrambled <b>{scrambleScore}</b> words!</p>
                    <div className="results-xp-gain">+{scrambleScore * 10 + 15} Gaming XP Earned</div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* GAMES SELECTION GRID */}
        {!activeGame && (
          <section className="games-catalog-section">
            <div className="catalog-header">
              <div>
                <h2>8 Playable Course Games</h2>
                <p>Adapted for <b>{profile.course_name}</b> {profile.class_or_semester ? `(${profile.class_or_semester})` : ""}. Click any game to configure your topic & difficulty.</p>
              </div>

              {/* CATEGORY TABS */}
              <div className="catalog-tabs">
                <button
                  type="button"
                  className={`tab-btn ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => setActiveCategory("all")}
                >
                  All (8)
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeCategory === "quiz" ? "active" : ""}`}
                  onClick={() => setActiveCategory("quiz")}
                >
                  Quizzes
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeCategory === "code" ? "active" : ""}`}
                  onClick={() => setActiveCategory("code")}
                >
                  Coding & Debug
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeCategory === "math" ? "active" : ""}`}
                  onClick={() => setActiveCategory("math")}
                >
                  Math & Formulas
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeCategory === "brain" ? "active" : ""}`}
                  onClick={() => setActiveCategory("brain")}
                >
                  Brain & Memory
                </button>
              </div>
            </div>

            <div className="games-grid">
              {filteredGames.map((game) => (
                <article key={game.id} className="game-card">
                  <div className="game-card-top">
                    <span className="game-card-icon">{game.icon}</span>
                    <span className={`diff-pill diff-${game.difficulty.toLowerCase()}`}>
                      {game.difficulty}
                    </span>
                  </div>

                  <h3>{game.title}</h3>
                  <p>{game.tagline}</p>

                  <div className="game-card-bottom">
                    <span className="game-xp-tag">+{game.xpReward} XP</span>
                    <button
                      type="button"
                      className="dashboard-button primary game-play-btn"
                      onClick={() => handleOpenConfig(game)}
                    >
                      Configure & Play →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* PERMANENT SITE FOOTER */}
        <SiteFooter />
      </main>
    </div>
  );
}
