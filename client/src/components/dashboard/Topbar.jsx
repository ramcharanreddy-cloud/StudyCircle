import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Menu,
  Command,
  ChevronRight,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";
import api from "../../lib/api";

const routeNames = [
  ["/dashboard", "Overview"],
  ["/groups", "My circles"],
  ["/discover", "Explore circles"],
  ["/discussions", "Discussions"],
  ["/resources", "Resource library"],
  ["/sessions", "Study sessions"],
  ["/chat", "Live group chat"],
  ["/notes", "Shared notes"],
  ["/calendar", "Calendar"],
  ["/notifications", "Notifications"],
  ["/settings", "Settings"],
  ["/admin", "Admin console"],
];

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const active = [...routeNames]
    .sort((a, b) => b[0].length - a[0].length)
    .find(
      ([path]) =>
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`)
    );

  const title = active?.[1] || "Workspace";

  // Keep notification connection independent of route changes.
  useEffect(() => {
    let alive = true;

    api
      .get("/notifications/unread-count")
      .then((response) => {
        if (alive) {
          setUnread(response.data.unreadCount || 0);
        }
      })
      .catch(() => {});

    const token = localStorage.getItem("studycircle_token");

    if (!token) {
      return () => {
        alive = false;
      };
    }

    const socket = io(
      import.meta.env.VITE_API_SOCKET_URL || "http://localhost:5000",
      {
        auth: { token },
        transports: ["websocket", "polling"],
      }
    );

    socket.on("notification:new", () => {
      if (alive) {
        setUnread((value) => value + 1);
      }
    });

    return () => {
      alive = false;
      socket.disconnect();
    };
  }, []);

  // Close mobile search after navigating.
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (query) {
      navigate(`/discover?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  const toggleSearch = () => {
    setSearchOpen((value) => !value);
  };

  return (
    <header className="sc-topbar">
      <div className="sc-topbar-left">
        <button
          type="button"
          onClick={onMenuClick}
          className="sc-mobile-menu"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <div className="sc-breadcrumb">
            <span>STUDYCIRCLE</span>
            <ChevronRight size={11} />
            <span>WORKSPACE</span>
          </div>

          <div className="sc-top-title">{title}</div>
        </div>
      </div>

      <div className={`sc-topbar-right ${searchOpen ? "search-active" : ""}`}>
        <form
          onSubmit={handleSearch}
          className={`sc-searchbox ${searchOpen ? "is-open" : ""}`}
        >
          <button
            type="button"
            className="sc-search-toggle"
            onClick={toggleSearch}
            aria-label={searchOpen ? "Close search" : "Open search"}
          >
            {searchOpen ? <X size={17} /> : <Search size={16} />}
          </button>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a circle or topic..."
            aria-label="Search circles and topics"
          />

          <span>
            <Command size={10} /> K
          </span>
        </form>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="sc-notification-button"
        >
          <Bell size={18} />
          {unread > 0 && (
            <i>{unread > 9 ? "9+" : unread}</i>
          )}
        </button>

        <div className="sc-top-profile">
          <span>{user?.name?.charAt(0)?.toUpperCase() || "S"}</span>

          <div>
            <b>{user?.name || "Student"}</b>
            <small>Member workspace</small>
          </div>
        </div>
      </div>
    </header>
  );
}