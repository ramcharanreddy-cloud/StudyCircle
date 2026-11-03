import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Compass,
  MessageSquare,
  FolderOpen,
  CalendarDays,
  Bell,
  Settings,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
  NotebookPen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const sections = [
  {
    label: "YOUR SPACE",
    items: [
      { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
      { name: "My circles", path: "/groups", icon: Users },
      { name: "Explore", path: "/discover", icon: Compass },
    ],
  },
  {
    label: "COLLABORATE",
    items: [
      { name: "Discussions", path: "/discussions", icon: MessageSquare },
      { name: "Live chat", path: "/chat", icon: MessagesSquare },
      { name: "Shared notes", path: "/notes", icon: NotebookPen },
      { name: "Resources", path: "/resources", icon: FolderOpen },
    ],
  },
  {
    label: "PLAN YOUR TIME",
    items: [
      { name: "Study sessions", path: "/sessions", icon: CalendarDays },
      { name: "Calendar", path: "/calendar", icon: CalendarDays },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = () => {
    onNavigate?.();
  };

  const signOut = () => {
    onNavigate?.();
    logout();
    navigate("/", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `sc-nav-link ${isActive ? "active" : ""}`;

  return (
    <aside className={`sc-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      {/* Brand */}
      <div className="sc-brand">
        <div className="sc-brand-mark">
          <BookOpen size={20} />
          <span />
        </div>

        {!collapsed && (
          <div className="sc-brand-copy">
            <b>
              study<span>circle</span>
            </b>
            <small>LEARN · SHARE · GROW</small>
          </div>
        )}

        <button
          type="button"
          className="sc-collapse"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sc-side-nav" aria-label="Main navigation">
        {sections.map((section) => (
          <div className="sc-nav-section" key={section.label}>
            {!collapsed && (
              <div className="sc-nav-label">{section.label}</div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  title={collapsed ? item.name : undefined}
                  onClick={handleNavigation}
                  className={navLinkClass}
                >
                  <Icon size={18} />

                  {!collapsed && <span>{item.name}</span>}

                  {item.path === "/chat" && !collapsed && (
                    <i className="sc-nav-pulse" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Personal */}
        <div className="sc-nav-section">
          {!collapsed && <div className="sc-nav-label">PERSONAL</div>}

          <NavLink
            to="/notifications"
            title={collapsed ? "Notifications" : undefined}
            onClick={handleNavigation}
            className={navLinkClass}
          >
            <Bell size={18} />
            {!collapsed && <span>Notifications</span>}
          </NavLink>

          <NavLink
            to="/settings"
            title={collapsed ? "Settings" : undefined}
            onClick={handleNavigation}
            className={navLinkClass}
          >
            <Settings size={18} />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              title={collapsed ? "Admin console" : undefined}
              onClick={handleNavigation}
              className={navLinkClass}
            >
              <ShieldCheck size={18} />
              {!collapsed && <span>Admin console</span>}
            </NavLink>
          )}
        </div>
      </nav>

      {/* Sidebar message */}
      {!collapsed && (
        <div className="sc-side-note">
          <span>
            <Sparkles size={15} />
          </span>
          <b>Better together.</b>
          <p>Make room for one good idea today.</p>
        </div>
      )}

      {/* User profile */}
      <div className="sc-side-profile">
        <div className="sc-user-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "S"}
        </div>

        {!collapsed && (
          <div className="sc-user-meta">
            <b>{user?.name || "Student"}</b>
            <small>{user?.email || "StudyCircle member"}</small>
          </div>
        )}

        <button
          type="button"
          className="sc-signout"
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}