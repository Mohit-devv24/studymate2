"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  fetchTestPresets,
  generateTestApi,
  submitTestAttemptApi,
  fetchTestHistoryApi,
  type TestPreset,
  type GeneratedTestResponse,
  type TestSubmissionResult,
  type TestHistoryItem,
} from "@/lib/testApi";
import {
  BrainCircuit,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Flag,
  BarChart2,
  History,
  BookOpen,
  GraduationCap,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

type PageMode = "config" | "taking" | "scorecard" | "history";

export default function TestsPage() {
  const [mode, setMode] = useState<PageMode>("config");
  const [presets, setPresets] = useState<TestPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [customCourse, setCustomCourse] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [customChapter, setCustomChapter] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timeLimit, setTimeLimit] = useState<number>(10);

  // Active Test State
  const [activeTest, setActiveTest] = useState<GeneratedTestResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Scorecard State
  const [submissionResult, setSubmissionResult] = useState<TestSubmissionResult | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<TestHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load presets on mount
  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await fetchTestPresets();
        setPresets(data);
        if (data.length > 0) {
          const firstCourse = data[0];
          setSelectedCourse(firstCourse.course);
          if (firstCourse.subjects.length > 0) {
            setSelectedSubject(firstCourse.subjects[0].name);
            if (firstCourse.subjects[0].chapters.length > 0) {
              setSelectedChapter(firstCourse.subjects[0].chapters[0]);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load presets:", err);
      }
    }
    loadPresets();
  }, []);

  // Update subjects list when course changes
  const currentCoursePresets = presets.find((p) => p.course === selectedCourse);
  const availableSubjects = currentCoursePresets ? currentCoursePresets.subjects : [];
  const currentSubjectObj = availableSubjects.find((s) => s.name === selectedSubject);
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

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    const foundSub = availableSubjects.find((s) => s.name === subject);
    if (foundSub && foundSub.chapters.length > 0) {
      setSelectedChapter(foundSub.chapters[0]);
    } else {
      setSelectedChapter("");
    }
  };

  // Timer countdown
  useEffect(() => {
    if (mode !== "taking" || timeLimit === 0) return;
    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, secondsRemaining, timeLimit]);

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
      const generated = await generateTestApi({
        course,
        subject,
        chapter,
        num_questions: numQuestions,
        difficulty,
        time_limit_minutes: timeLimit,
      });

      setActiveTest(generated);
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setCurrentQIndex(0);
      setSecondsRemaining(timeLimit > 0 ? timeLimit * 60 : 0);
      setStartTime(Date.now());
      setMode("taking");
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to generate test. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Option Select
  const handleSelectOption = (questionId: number, optionText: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionText,
    }));
  };

  // Toggle Flag
  const toggleFlag = (index: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Auto Submit when time expires
  const handleAutoSubmit = () => {
    handleSubmitTest();
  };

  // Manual Submit
  const handleSubmitTest = async () => {
    if (!activeTest) return;
    setLoading(true);
    setError(null);

    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const result = await submitTestAttemptApi(activeTest.id, {
        answers: userAnswers,
        time_taken_seconds: timeSpent,
      });

      setSubmissionResult(result);
      setMode("scorecard");

      // Celebrate high score
      if (result.percentage >= 70) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to submit test.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch History
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await fetchTestHistoryApi();
      setHistoryList(list);
    } catch (err: any) {
      console.error("Failed to load test history:", err);
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
    <DashboardLayout
      title="Adaptive Test Generator"
      subtitle="Dynamic tests tailored to your Course, Subject, and Chapter"
    >
      {/* Top Mode Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMode("config");
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "config" || mode === "taking" || mode === "scorecard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <BrainCircuit size={16} />
            <span>Generate & Practice</span>
          </button>
          <button
            onClick={() => {
              setMode("history");
              loadHistory();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "history"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <History size={16} />
            <span>Test History</span>
          </button>
        </div>

        {mode === "taking" && activeTest && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3.5 py-1.5 rounded-full">
            <Clock size={16} className="text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              {timeLimit > 0 ? formatSeconds(secondsRemaining) : "Untimed"}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 1: CONFIGURATION & GENERATOR STUDIO                      */}
      {/* ============================================================ */}
      {mode === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Configure Your Test
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Specify your syllabus details to generate custom exam-ready questions.
                  </p>
                </div>
              </div>

              {/* Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {isCustomMode ? "Use Curated Presets" : "Enter Custom Details"}
              </button>
            </div>

            <form onSubmit={handleGenerateTest} className="mt-6 space-y-5">
              {/* 1. Course Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  1. Course / Academic Program
                </label>
                {isCustomMode ? (
                  <input
                    type="text"
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    placeholder="e.g. B.Tech Artificial Intelligence, B.Sc Physics, MCA..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {presets.map((p) => {
                      const isSelected = selectedCourse === p.course;
                      return (
                        <button
                          type="button"
                          key={p.course}
                          onClick={() => handleCourseChange(p.course)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <GraduationCap size={16} className={isSelected ? "text-indigo-600" : "text-slate-400"} />
                            {isSelected && <Check size={14} className="text-indigo-600" />}
                          </div>
                          <p className="text-xs font-bold truncate">{p.course}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {p.subjects.length} Subjects available
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Subject Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  2. Subject
                </label>
                {isCustomMode ? (
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. Machine Learning, Cloud Computing, Microprocessors..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
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
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-600 dark:text-slate-400 outline-none placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>

              {/* 3. Chapter / Topic Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  3. Chapter / Topic Name
                </label>
                {isCustomMode ? (
                  <input
                    type="text"
                    value={customChapter}
                    onChange={(e) => setCustomChapter(e.target.value)}
                    placeholder="e.g. Neural Networks & Backpropagation, Convex Optimization..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
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
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-600 dark:text-slate-400 outline-none placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>

              {/* 4. Parameters Grid: Question Count, Difficulty, Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Num Questions */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Questions Count
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setNumQuestions(num)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          numQuestions === num
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        type="button"
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                          difficulty === diff
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Limit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Time Limit
                  </label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={5}>5 Minutes (Quick)</option>
                    <option value={10}>10 Minutes (Standard)</option>
                    <option value={15}>15 Minutes (Thorough)</option>
                    <option value={30}>30 Minutes (Deep Exam)</option>
                    <option value={0}>Untimed (Practice)</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Tailored Exam...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate & Launch Test Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Info & Tips Panel */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/60 dark:border-indigo-900/40">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm mb-2">
                <Zap size={18} />
                <span>How This Works</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                StudyMate synthesizes questions strictly matching the targeted syllabus chapter. Each test features:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Curriculum-aligned multiple choice questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>XP points awarded for every correct answer</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Instant scorecard with step-by-step explanations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Strengthens your streak and unlocks badges</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Popular Chapters
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Process Scheduling",
                  "Deadlock Detection",
                  "Relational Schema",
                  "de Broglie Waves",
                  "Matrix Eigenvalues",
                  "Gauss Law & Fields",
                  "Kirchhoff Rules",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setCustomChapter(tag);
                      setIsCustomMode(true);
                      setCustomSubject("Computer Science / Engineering");
                      setCustomCourse("B.Tech / Science");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {tag}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Card */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                  Question {currentQIndex + 1} of {activeTest.questions.length}
                </span>
                <span className="text-xs text-slate-400">
                  • {activeTest.subject} ({activeTest.chapter})
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleFlag(currentQIndex)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  flaggedQuestions.has(currentQIndex)
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Flag size={14} className={flaggedQuestions.has(currentQIndex) ? "fill-current" : ""} />
                <span>{flaggedQuestions.has(currentQIndex) ? "Flagged" : "Flag for Review"}</span>
              </button>
            </div>

            {/* Current Question */}
            {(() => {
              const currentQ = activeTest.questions[currentQIndex];
              const selectedOption = userAnswers[String(currentQ.id)];

              return (
                <div className="mt-6 space-y-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {currentQ.question_text}
                  </h3>

                  {/* Options List */}
                  <div className="space-y-3">
                    {currentQ.options.map((option, idx) => {
                      const isChosen = selectedOption === option;
                      const letter = String.fromCharCode(65 + idx);

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectOption(currentQ.id, option)}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            isChosen
                              ? "border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isChosen
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {letter}
                          </div>
                          <span className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {currentQIndex < activeTest.questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQIndex((prev) => Math.min(activeTest.questions.length - 1, prev + 1))}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
                        >
                          <span>Next</span>
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitTest}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                          {loading ? "Submitting..." : "Finish & Submit Test"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Question Palette Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Question Palette
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {activeTest.questions.map((q, idx) => {
                  const isAnswered = Boolean(userAnswers[String(q.id)]);
                  const isFlagged = flaggedQuestions.has(idx);
                  const isCurrent = currentQIndex === idx;

                  let colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                  if (isCurrent) colorClass = "ring-2 ring-indigo-500 bg-indigo-600 text-white font-bold";
                  else if (isFlagged) colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
                  else if (isAnswered) colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${colorClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>Answered ({Object.keys(userAnswers).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>Flagged ({flaggedQuestions.size})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>Unanswered ({activeTest.questions.length - Object.keys(userAnswers).length})</span>
                </div>
              </div>

              {/* Submit CTA in Palette */}
              <button
                type="button"
                onClick={handleSubmitTest}
                disabled={loading}
                className="w-full mt-5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow transition-all cursor-pointer"
              >
                {loading ? "Grading..." : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 3: SCORECARD & STEP-BY-STEP EXPLANATION                  */}
      {/* ============================================================ */}
      {mode === "scorecard" && submissionResult && (
        <div className="space-y-6">
          {/* Top Celebration Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                  <Award size={14} />
                  <span>Test Completed & Graded</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {submissionResult.percentage >= 80
                    ? "Outstanding Performance! 🌟"
                    : submissionResult.percentage >= 50
                    ? "Good Effort! Keep Pushing! 🚀"
                    : "Review & Master The Concepts 💡"}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
                  You earned <strong className="text-yellow-300">+{submissionResult.xp_awarded} XP</strong> points!
                  Detailed solutions and conceptual insights are ready below.
                </p>
              </div>

              {/* Score Circular Badge */}
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <div className="text-center">
                  <span className="text-3xl sm:text-4xl font-extrabold">{submissionResult.percentage}%</span>
                  <p className="text-[10px] uppercase tracking-wider text-indigo-200">Final Score</p>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="text-center">
                  <span className="text-2xl font-bold">
                    {submissionResult.score}/{submissionResult.total_marks}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider text-indigo-200">Marks</p>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="text-center">
                  <span className="text-2xl font-bold">{formatSeconds(submissionResult.time_taken_seconds)}</span>
                  <p className="text-[10px] uppercase tracking-wider text-indigo-200">Time Taken</p>
                </div>
              </div>
            </div>
          </div>

          {/* Solutions & Explanations Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Detailed Question Review & Explanations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Study each question to understand the core logic and correct rationale.
              </p>
            </div>
            <button
              onClick={() => {
                setMode("config");
                setActiveTest(null);
                setSubmissionResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              <RotateCcw size={14} />
              <span>Create Another Test</span>
            </button>
          </div>

          {/* Questions Review List */}
          <div className="space-y-4">
            {submissionResult.answers_review.map((item, idx) => (
              <div
                key={item.question_id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-500">Q{idx + 1}.</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {item.question_text}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      item.is_correct
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {item.is_correct ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {item.is_correct ? "Correct (+15 XP)" : "Incorrect (0 XP)"}
                  </span>
                </div>

                {/* Options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                  {item.options.map((opt, oIdx) => {
                    const isSelected = item.user_answer === opt;
                    const isCorrect = item.correct_answer === opt;

                    let badgeColor = "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400";
                    if (isCorrect) {
                      badgeColor = "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold";
                    } else if (isSelected && !item.is_correct) {
                      badgeColor = "border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 line-through";
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${badgeColor}`}
                      >
                        <span>{opt}</span>
                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            Correct Answer
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {item.explanation && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                    <HelpCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-slate-900 dark:text-white">Explanation: </strong>
                      <span>{item.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 4: TEST HISTORY                                         */}
      {/* ============================================================ */}
      {mode === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Your Practice Test History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your academic progress across different courses and subjects.
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw size={13} />
              <span>Refresh History</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-500">Loading your test history...</div>
          ) : historyList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <BrainCircuit size={36} className="mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Tests Taken Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate your first chapter-wise test to practice, earn XP, and track your performance!
              </p>
              <button
                onClick={() => setMode("config")}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow"
              >
                Launch Test Generator
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {item.difficulty}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {item.score} / {item.total_marks} ({item.percentage}%)
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.chapter}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{item.subject}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.course}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatSeconds(item.time_taken_seconds)}</span>
                    <span>{item.completed_at ? String(item.completed_at).slice(0, 10) : "Recent"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
