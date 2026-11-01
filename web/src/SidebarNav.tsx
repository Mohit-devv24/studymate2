import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./SidebarNav.css";
import studyMateLogo from "./assets/studymate-logo.png";
import { logoutUser } from "./api";

const navItems = [
  { path: "/dashboard", icon: "⌂", label: "Dashboard" },
  { path: "/games", icon: "🎮", label: "Gaming Zone" },
  { path: "/tests", icon: "⚡", label: "AI Test Generator" },
  { path: "/subjects", icon: "▣", label: "Subjects" },
  { path: "/tasks", icon: "✓", label: "Tasks" },
  { path: "/notes", icon: "□", label: "Notes" },
  { path: "/timer", icon: "◷", label: "Study Timer" },
  { path: "/planner", icon: "▦", label: "Planner" },
  { path: "/calendar", icon: "◫", label: "Calendar" },
  { path: "/goals", icon: "◎", label: "Goals" },
  { path: "/analytics", icon: "◒", label: "Analytics" },
  { path: "/habits", icon: "◌", label: "Habits" },
];

function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const userName = localStorage.getItem("userName") || "Student";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "S";

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("studymate_theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark-theme");
      document.body.classList.add("dark-theme");
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.remove("dark-theme");
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("studymate_theme", nextDark ? "dark" : "light");
  };

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <aside
      className={`app-sidebar ${menuOpen ? "mobile-menu-open" : ""}`}
    >
      <div className="app-sidebar-topbar">
        <NavLink
          to="/dashboard"
          className="app-sidebar-brand"
          onClick={closeMenu}
          aria-label="StudyMate home"
        >
          <img
            src={studyMateLogo}
            alt="StudyMate — Learn, Plan, Grow"
            className="app-sidebar-logo"
          />
        </NavLink>

        <button
          type="button"
          className="app-sidebar-menu-toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}

      <div className="app-sidebar-divider" />

      <nav className="app-sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMenu}
              className={`app-sidebar-item ${isActive ? "active" : ""}`}
            >
              <span className="app-sidebar-item-icon" aria-hidden="true">
                {item.icon}
              </span>

              <span className="app-sidebar-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="app-sidebar-bottom">
        <div className="app-sidebar-user">
          <div className="app-sidebar-avatar">{userInitial}</div>

          <div className="app-sidebar-user-copy">
            <strong>{userName}</strong>
            <small>Student</small>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button
            type="button"
            className="app-sidebar-logout"
            onClick={toggleTheme}
            style={{ flex: 1, padding: "8px 10px", justifyContent: "center" }}
            title="Toggle Light / Dark Mode"
          >
            <span>{isDark ? "☀️ Light" : "🌙 Dark"}</span>
          </button>
          <button
            type="button"
            className="app-sidebar-logout"
            onClick={handleLogout}
            style={{ padding: "8px 12px" }}
            title="Log out"
          >
            <span aria-hidden="true">↪</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default SidebarNav;