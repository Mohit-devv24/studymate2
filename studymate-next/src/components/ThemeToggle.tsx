"use client";

import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";
import React from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-3)] transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-[var(--ink)] transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
