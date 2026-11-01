"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { SiteFooter } from "./SiteFooter";
import { Menu, X, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { getStoredUser } from "@/lib/api";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = getStoredUser();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)] font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-[var(--surface)] border-r border-[var(--line)] shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)]"
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--surface)]/90 px-4 md:px-8 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex md:hidden p-2 rounded-xl text-[var(--ink-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            {title ? (
              <div>
                <h1 className="text-lg md:text-xl font-bold text-[var(--ink)] tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-[var(--ink-muted)] hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--ink)]">StudyMate</span>
              </div>
            )}
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Test Launch Pill */}
            <Link
              href="/tests"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all hover:scale-[1.02]"
            >
              <BrainCircuit size={14} />
              <span>Create Test</span>
            </Link>

            <ThemeToggle />

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--line)]">
              <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : "S"}
              </div>
              <span className="text-xs font-medium text-[var(--ink-secondary)] hidden lg:inline">
                {user?.name || "Student"}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content & Sticky Footer Container */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
