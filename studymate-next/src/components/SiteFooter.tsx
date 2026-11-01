"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Heart, Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full mt-auto border-t border-white/10 bg-[#0B0F17] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-xl bg-[#b87542] text-white flex items-center justify-center font-black text-sm tracking-tight shadow-sm group-hover:scale-105 transition-transform">
                SM
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white">StudyMate</span>
                <span className="text-[9px] uppercase tracking-wider text-[#8e929e] font-semibold">Your Study Space</span>
              </div>
            </Link>
            <p className="text-xs text-[#9b9ea7] leading-relaxed">
              Elevate your daily study sessions with adaptive AI tests, smart note-taking, and focused habit tracking.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#141923] border border-white/10 text-[#d1d5db]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>v2.0 Warm Paper Edition</span>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#d48955]">
              Workspace
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/tests" className="inline-flex items-center gap-1.5 text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  <span>AI Test Generator</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#b87542]/20 text-[#d48955]">AI</span>
                </Link>
              </li>
              <li>
                <Link href="/subjects" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Subjects & Chapters
                </Link>
              </li>
              <li>
                <Link href="/tasks" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Task Tracker
                </Link>
              </li>
              <li>
                <Link href="/notes" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Study Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Productivity Tools */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#d48955]">
              Tools
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/timer" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Pomodoro Timer
                </Link>
              </li>
              <li>
                <Link href="/planner" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Study Planner
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Academic Calendar
                </Link>
              </li>
              <li>
                <Link href="/goals" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Goal Milestones
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-[#9b9ea7] hover:text-[#d48955] transition-colors">
                  Progress Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Author & Connect */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#d48955]">
              Built & Powered By
            </span>
            <div className="p-3.5 rounded-xl bg-[#141923] border border-white/10 space-y-2">
              <strong className="block text-sm font-semibold text-white">
                Mohit Goyal
              </strong>
              <p className="text-[11px] text-[#8e929e]">
                Full-Stack Developer & Student
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://www.linkedin.com/in/mohit-goyal-tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#d1d5db] hover:text-[#d48955] transition-colors"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight size={12} />
                </a>
                <span className="text-white/20">•</span>
                <a
                  href="https://www.instagram.com/yaarr2410?stkn=MWpqZ292bjN0a29pcw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#d1d5db] hover:text-[#d48955] transition-colors"
                >
                  <span>Instagram</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#727682]">
          <div className="flex items-center gap-1.5">
            <span>© 2026 StudyMate.</span>
            <span>Crafted with</span>
            <Heart size={12} className="text-[#d48955] fill-[#d48955]" />
            <span>for students worldwide.</span>
          </div>
          <div>
            <span>Designed & developed by </span>
            <span className="font-medium text-white">Mohit Goyal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
