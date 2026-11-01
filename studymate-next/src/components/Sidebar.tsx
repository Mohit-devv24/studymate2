"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  CheckSquare,
  FileText,
  Timer,
  CalendarDays,
  Calendar,
  Target,
  BarChart3,
  Flame,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { clearAuthToken, getStoredUser } from "@/lib/api";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "AI Test Generator",
    href: "/tests",
    icon: BrainCircuit,
    badge: "AI",
    highlight: true,
  },
  {
    name: "Subjects",
    href: "/subjects",
    icon: BookOpen,
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Notes",
    href: "/notes",
    icon: FileText,
  },
  {
    name: "Study Timer",
    href: "/timer",
    icon: Timer,
  },
  {
    name: "Planner",
    href: "/planner",
    icon: CalendarDays,
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    name: "Goals",
    href: "/goals",
    icon: Target,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Habits",
    href: "/habits",
    icon: Flame,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthToken();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-all duration-300 z-30 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--line)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-sm font-bold text-sm">
            SM
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-[var(--ink)]">
                StudyMate
              </span>
              <span className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                Pro Learning Hub
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)] transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className={cn("px-2 pb-2 text-[10px] font-bold tracking-wider text-[var(--ink-muted)] uppercase", collapsed && "text-center")}>
          {collapsed ? "•••" : "Workspace"}
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[var(--accent-light)] text-[var(--accent)] font-semibold shadow-xs"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
                item.highlight && !isActive && "text-[var(--accent)] font-semibold"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-[var(--accent)]"
                    : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]",
                  item.highlight && "text-[var(--accent)]"
                )}
              />
              {!collapsed && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-3 hidden rounded-md bg-[var(--surface-2)] border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] shadow-lg group-hover:block z-50 whitespace-nowrap">
                  {item.name}
                  {item.badge && ` (${item.badge})`}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User profile & actions footer */}
      <div className="border-t border-[var(--line)] p-3 space-y-2 bg-[var(--surface-2)]/50">
        <div className="flex items-center justify-between px-1">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : <UserIcon size={14} />}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--ink)] truncate">
                  {user?.name || "Student"}
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] truncate">
                  {user?.email || "Pro Learner"}
                </p>
              </div>
            </div>
          )}
          <ThemeToggle />
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors",
            collapsed && "justify-center"
          )}
          title="Sign Out"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
