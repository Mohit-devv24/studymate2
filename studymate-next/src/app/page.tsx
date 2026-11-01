import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Timer,
  BarChart3,
  Flame,
  ArrowRight,
  Shield,
  Zap,
  Target,
  GraduationCap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] text-[var(--ink)] font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs font-bold text-sm">
              SM
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-[var(--ink)]">
                StudyMate
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">
                Your Study Space
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs transition-all hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20 mb-8">
            <Sparkles size={14} />
            <span>AI Test Generator with Groq Llama 3.3 70B & GPT-OSS-120B</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--ink)] max-w-4xl mx-auto leading-[1.12]">
            Transform your study routine into <span className="text-[var(--accent)] italic font-serif">effortless mastery</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[var(--ink-secondary)] max-w-2xl mx-auto leading-relaxed">
            Organize subjects, practice adaptive chapter tests powered by cutting-edge AI, track streaks, and retain information faster with intelligent active recall.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-md shadow-[var(--accent-glow)] transition-all hover:scale-[1.02]"
            >
              <span>Start Learning Free</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)] hover:bg-[var(--surface-3)] transition-all"
            >
              <span>Explore Dashboard</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <p className="text-2xl font-bold text-[var(--accent)]">100%</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Dynamic AI Quizzes</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <p className="text-2xl font-bold text-[var(--ink)]">11+</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Academic Tools</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <p className="text-2xl font-bold text-[var(--accent)]">2.5x</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Retention Speed</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <p className="text-2xl font-bold text-[var(--ink)]">0s</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Setup Friction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-[var(--surface-2)] border-t border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
              Built for serious students who value clarity.
            </h2>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Replace chaotic notes and multiple scattered tools with one cohesive study workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-4">
                <BrainCircuit size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] mb-2">
                Adaptive AI Test Engine
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                Generate real-time conceptual MCQs tailored to any engineering or science syllabus, with step-by-step explanations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <BookOpen size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] mb-2">
                Subject & Chapter Architecture
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                Organize your semester into clean subject hierarchies, syllabus completion bars, and revision markers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                <Timer size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] mb-2">
                Focused Pomodoro & Study Timer
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                Stay in deep flow with customized intervals, ambient audio presets, and automatic session logging.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] mb-2">
                Smart Task & Milestone Tracker
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                Prioritize homework, projects, and test dates with intelligent priority badges and celebratory completion feedback.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
                <Flame size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] mb-2">
                Consistency & Habit Streaks
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                Build unstoppable study routines with visual streak counters, XP rewards, and gamified progress tracking.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-4">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] mb-2">
                Deep Performance Analytics
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                Visualize study hours, quiz mastery rates, and weekly consistency trends to optimize exam prep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reusable Site Footer */}
      <SiteFooter />
    </div>
  );
}
