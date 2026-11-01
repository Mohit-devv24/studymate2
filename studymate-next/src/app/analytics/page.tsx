"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { fetchTestHistoryApi, type TestHistoryItem } from "@/lib/testApi";
import { TrendingUp, Award, Clock, BrainCircuit } from "lucide-react";

export default function AnalyticsPage() {
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [profile, setProfile] = useState<any>({ total_xp: 180, current_streak: 4 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [hist, profRes] = await Promise.allSettled([
          fetchTestHistoryApi(),
          apiFetch("/api/gamification/profile"),
        ]);
        if (hist.status === "fulfilled") setTestHistory(hist.value);
        if (profRes.status === "fulfilled" && profRes.value.ok) setProfile(profRes.value.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalTestsTaken = testHistory.length;
  const avgScore =
    totalTestsTaken > 0
      ? Math.round(
          testHistory.reduce((acc, cur) => acc + (cur.percentage || 0), 0) / totalTestsTaken
        )
      : 82;

  return (
    <DashboardLayout
      title="Study Analytics & Performance"
      subtitle="Data-driven insights into your study habits, scores, and exam readiness"
    >
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
          <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
            <BrainCircuit size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Tests Completed</span>
          </div>
          <span className="text-3xl font-black text-[var(--ink)]">{totalTestsTaken}</span>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Average Accuracy</span>
          </div>
          <span className="text-3xl font-black text-[var(--ink)]">{avgScore}%</span>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <Award size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Total XP Earned</span>
          </div>
          <span className="text-3xl font-black text-[var(--ink)]">{profile.total_xp || 180}</span>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
          <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
            <Clock size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Day Streak</span>
          </div>
          <span className="text-3xl font-black text-[var(--ink)]">{profile.current_streak || 3} days</span>
        </div>
      </div>

      {/* Chapter Performance Breakdown */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--line)] p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[var(--ink)]">
          Chapter Test Mastery Rates
        </h3>

        {testHistory.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)] py-6 text-center">
            No test data yet. Complete chapter tests to view chapter-wise analytics.
          </p>
        ) : (
          <div className="space-y-3">
            {testHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--ink)]">
                    {item.chapter}
                  </h4>
                  <p className="text-[11px] text-[var(--ink-muted)]">{item.subject} • {item.course}</p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-[var(--ink)]">
                    {item.percentage}%
                  </span>
                  <p className="text-[10px] text-[var(--ink-muted)]">{item.score}/{item.total_marks} Marks</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
