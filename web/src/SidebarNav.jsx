import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./SidebarNav.css";

const navItems = [
  { path: "/dashboard", icon: "⌂", label: "Dashboard" },
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

  const userName = localStorage.getItem("userName") || "Student";
  const userInitial =
    userName.trim().charAt(0).toUpperCase() || "S";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    navigate("/login");
  };

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand">
        <div className="app-sidebar-brand-mark">SM</div>

        <div className="app-sidebar-brand-text">
          <strong>StudyMate</strong>
          <span>YOUR STUDY SPACE</span>
        </div>
      </div>

      <div className="app-sidebar-divider" />

      <nav className="app-sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`app-sidebar-item ${
                isActive ? "active" : ""
              }`}
            >
              <span className="app-sidebar-item-icon">
                {item.icon}
              </span>

              <span className="app-sidebar-label">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="app-sidebar-bottom">
        <div className="app-sidebar-user">
          <div className="app-sidebar-avatar">
            {userInitial}
          </div>

          <div className="app-sidebar-user-copy">
            <strong>{userName}</strong>
            <small>Student</small>
          </div>
        </div>

        <button
          type="button"
          className="app-sidebar-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Log out
        </button>
      </div>
    </aside>
  );
}

export default SidebarNav;