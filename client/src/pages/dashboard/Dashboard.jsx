import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, ArrowRight, BookOpen, CalendarDays, Clock3, Compass,
  Flame, FolderOpen, MessageSquare, RefreshCw, Sparkles, Users, Video,
  AlertCircle, Bell, Plus, Search
} from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const relativeTime = (value) => {
  if (!value) return "Recently";
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

const dateParts = (value) => {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString(undefined, { day: "2-digit" }),
    month: date.toLocaleDateString(undefined, { month: "short" }),
    time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/dashboard");
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't load your workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const stats = data?.statistics || {};
  const groups = data?.joinedGroups || [];
  const sessions = data?.upcomingSessions || [];
  const discussions = data?.recentDiscussions || [];
  const notifications = data?.recentNotifications || [];

  const activity = useMemo(() => [
    ...discussions.map(item => ({
      id: `d-${item._id}`, name: item.author?.name || "A member",
      action: "started a discussion", detail: item.title || item.content,
      when: item.createdAt, icon: MessageSquare, tone: "violet"
    })),
    ...notifications.map(item => ({
      id: `n-${item._id}`, name: item.sender?.name || "StudyCircle",
      action: "sent an update", detail: item.message || item.title,
      when: item.createdAt, icon: Bell, tone: "cyan"
    }))
  ].sort((a, b) => new Date(b.when) - new Date(a.when)).slice(0, 5), [discussions, notifications]);

  const tiles = [
    { label: "Study groups", value: stats.totalGroups ?? groups.length, note: `${stats.groupsCreated ?? 0} created by you`, icon: Users, tint: "violet" },
    { label: "Discussions", value: stats.totalDiscussions ?? 0, note: "Across your groups", icon: MessageSquare, tint: "blue" },
    { label: "Upcoming sessions", value: stats.totalUpcomingSessions ?? sessions.length, note: "On your schedule", icon: CalendarDays, tint: "mint" },
    { label: "Unread updates", value: stats.unreadNotifications ?? 0, note: "Worth a quick look", icon: Bell, tint: "amber" }
  ];

  return (
    <DashboardLayout>
      <div className="sc-dashboard space-y-7">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="sc-command-hero">
          <div className="relative z-10 max-w-2xl">
            <div className="sc-eyebrow"><span className="sc-live-dot" /> YOUR CAMPUS, IN SYNC</div>
            <h1>{greeting}, {firstName}<span className="sc-heading-spark">✳</span></h1>
            <p>Your people, ideas and next study session — all in one place. Pick up where you left off.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => navigate("/discover")} className="sc-primary"><Compass size={16}/> Find your circle <ArrowUpRight size={15}/></button>
              <button onClick={() => navigate("/sessions")} className="sc-secondary"><CalendarDays size={16}/> Plan a session</button>
            </div>
          </div>
          <div className="sc-orbit-art" aria-hidden="true">
            <div className="sc-orbit sc-orbit-one"/><div className="sc-orbit sc-orbit-two"/>
            <div className="sc-orbit-core"><BookOpen size={34}/></div>
            <span className="sc-orbit-chip chip-a"><Users size={14}/></span>
            <span className="sc-orbit-chip chip-b"><MessageSquare size={14}/></span>
            <span className="sc-orbit-chip chip-c"><Sparkles size={14}/></span>
          </div>
          <div className="sc-hero-index"><span>SC / 01</span><span>LEARN BETTER, TOGETHER</span></div>
        </motion.section>

        {error && <div className="sc-error"><AlertCircle size={18}/><span>{error}</span><button onClick={load}>Retry</button></div>}

        <section className="sc-metric-grid">
          {tiles.map((tile, index) => {
            const Icon = tile.icon;
            return <motion.article key={tile.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className={`sc-metric metric-${tile.tint}`}>
              <div className="sc-metric-top"><span>{tile.label}</span><span className="sc-metric-icon"><Icon size={17}/></span></div>
              <div className="sc-metric-value">{loading ? "—" : tile.value}</div>
              <div className="sc-metric-note">{tile.note}</div>
            </motion.article>;
          })}
        </section>

        <div className="sc-workspace-grid">
          <section className="sc-panel sc-groups-panel">
            <div className="sc-panel-heading">
              <div><span className="sc-section-kicker">YOUR PEOPLE</span><h2>Study circles</h2><p>Spaces where your next idea takes shape.</p></div>
              <button className="sc-icon-action" onClick={() => navigate("/groups")} aria-label="View all groups"><ArrowUpRight size={18}/></button>
            </div>
            {loading ? <div className="sc-empty">Loading your circles…</div> : groups.length ? <div className="sc-group-grid">
              {groups.slice(0, 4).map((group, index) => <button key={group._id} onClick={() => navigate(`/groups/${group._id}`)} className={`sc-group-card group-tone-${index % 4}`}>
                <div className="sc-group-card-top"><span className="sc-group-mark">{["◈","⌘","✳","△"][index % 4]}</span><ArrowUpRight size={15}/></div>
                <strong>{group.name}</strong>
                <span>{group.subject || "Study group"}</span>
                <div className="sc-group-meta"><Users size={13}/>{group.members?.length || 0} members <i/><span>Open circle</span></div>
              </button>)}
              <button className="sc-add-group" onClick={() => navigate("/discover")}><span><Plus size={20}/></span><b>Find another circle</b><small>Explore what others are learning</small></button>
            </div> : <div className="sc-empty"><Users size={25}/><b>Your circles start here</b><span>Discover a group and learn alongside people with similar goals.</span><button onClick={() => navigate("/discover")}>Explore groups <ArrowRight size={14}/></button></div>}
          </section>

          <section className="sc-panel sc-agenda-panel">
            <div className="sc-panel-heading">
              <div><span className="sc-section-kicker">UP NEXT</span><h2>Your agenda</h2><p>Keep your momentum moving.</p></div>
              <button className="sc-text-link" onClick={() => navigate("/calendar")}>Calendar <ArrowUpRight size={14}/></button>
            </div>
            {loading ? <div className="sc-empty">Loading sessions…</div> : sessions.length ? <div className="sc-agenda-list">
              {sessions.slice(0, 4).map(session => {
                const date = dateParts(session.scheduledAt);
                return <article key={session._id} className="sc-agenda-item">
                  <div className="sc-date-block"><b>{date.day}</b><span>{date.month}</span></div>
                  <div className="sc-agenda-copy"><strong>{session.title}</strong><span><Clock3 size={12}/>{date.time} · {session.duration || 60} min</span><small>{session.group?.name || session.groupName || "Study session"}</small></div>
                  {session.meetingLink ? <a href={session.meetingLink} target="_blank" rel="noreferrer" className="sc-join-link"><Video size={14}/> Join</a> : <span className="sc-agenda-arrow"><ArrowUpRight size={16}/></span>}
                </article>;
              })}
            </div> : <div className="sc-empty"><CalendarDays size={25}/><b>Your calendar is clear</b><span>Schedule a focused study session with your group.</span><button onClick={() => navigate("/sessions")}>Create a session <ArrowRight size={14}/></button></div>}
            <button className="sc-agenda-footer" onClick={() => navigate("/sessions")}>Plan your next session <ArrowRight size={15}/></button>
          </section>
        </div>

        <section className="sc-panel sc-activity-panel">
          <div className="sc-panel-heading">
            <div><span className="sc-section-kicker">THE LATEST</span><h2>Circle activity</h2><p>A little context from the spaces you’re part of.</p></div>
            <button className="sc-text-link" onClick={() => navigate("/discussions")}>Open discussions <ArrowUpRight size={14}/></button>
          </div>
          {activity.length ? <div className="sc-activity-list">{activity.map(item => {
            const Icon = item.icon;
            return <article key={item.id} className="sc-activity-row"><span className={`sc-activity-icon tone-${item.tone}`}><Icon size={15}/></span><div><strong>{item.name}</strong><span>{item.action}</span><p>{item.detail}</p></div><time>{relativeTime(item.when)}</time></article>;
          })}</div> : <div className="sc-empty compact"><Flame size={21}/><span>New discussions and group updates will appear here.</span></div>}
        </section>
        <footer className="sc-dashboard-footer"><span>STUDYCIRCLE / YOUR SHARED LEARNING SPACE</span><span>MAKE PROGRESS, TOGETHER ↗</span></footer>
      </div>
    </DashboardLayout>
  );
}
