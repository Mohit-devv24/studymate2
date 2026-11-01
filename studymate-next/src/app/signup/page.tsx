"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { registerUser, saveAuthToken, saveUser } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser(name.trim(), email.trim(), password);
      saveAuthToken(data.access_token);
      if (data.user) {
        saveUser(data.user);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] text-[var(--ink)] font-sans">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs font-bold text-sm group-hover:scale-105 transition-transform">
              SM
            </div>
            <span className="font-bold text-2xl tracking-tight text-[var(--ink)]">
              StudyMate
            </span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
            Create your study account
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--ink-muted)]">
            Start organizing your study schedule and generating adaptive AI tests
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-[var(--surface)] py-8 px-6 sm:px-10 shadow-sm rounded-3xl border border-[var(--line)]">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-[var(--ink-muted)]" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-[var(--ink-muted)]" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-[var(--ink-muted)]" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Creating Account..." : "Create Account"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-[var(--line)] text-center">
              <p className="text-xs text-[var(--ink-muted)]">
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
                  Sign In instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
