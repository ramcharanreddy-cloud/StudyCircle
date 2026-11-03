
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  BookOpen,
  RefreshCw,
  Filter,
  AlertCircle,
  Compass,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import GroupCard from "../../components/groups/GroupCard";
import CreateGroupModal from "../../components/groups/CreateGroupModal";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function MyGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [leavingId, setLeavingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/dashboard");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to fetch your groups."
        );
      }

      setGroups(response.data.joinedGroups || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load your groups."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        group.name?.toLowerCase().includes(query) ||
        group.subject?.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query) ||
        group.tags?.some((tag) => tag.toLowerCase().includes(query));

      const matchesPrivacy =
        filter === "all" || group.privacy === filter;

      return matchesSearch && matchesPrivacy;
    });
  }, [groups, search, filter]);

  const createGroup = async (payload) => {
    setCreating(true);
    setActionMessage("");

    try {
      const response = await api.post("/groups", payload);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to create group."
        );
      }

      await fetchGroups();
      setModalOpen(false);
      setActionMessage("Your study group was created successfully.");
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        "Unable to create group."
      );
    } finally {
      setCreating(false);
    }
  };

  const leaveGroup = async (group) => {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${group.name}"?`
    );

    if (!confirmed) return;

    setLeavingId(group._id);
    setActionMessage("");

    try {
      const response = await api.delete(`/groups/${group._id}/leave`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to leave this group."
        );
      }

      setGroups((current) =>
        current.filter((item) => item._id !== group._id)
      );

      setActionMessage(`You left "${group.name}".`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to leave this group."
      );
    } finally {
      setLeavingId(null);
    }
  };

  const publicCount = groups.filter(
    (group) => group.privacy === "public"
  ).length;

  const privateCount = groups.filter(
    (group) => group.privacy === "private"
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* PAGE HEADER */}

        <section className="relative overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-r from-[#191635] via-[#17172e] to-[#101c34] p-7 sm:p-9">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-violet-500/15 blur-[90px]" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <Users size={14} />
                YOUR COMMUNITIES
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                My Study Groups
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                Learn together, exchange ideas and collaborate with
                communities that share your interests.
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
            >
              <Plus size={18} />
              Create group
            </button>
          </div>
        </section>

        {/* SUMMARY CARDS */}

        <section className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111526] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total groups</p>
              <Users className="text-violet-400" size={20} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">
              {loading ? "—" : groups.length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Communities you're part of
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#111526] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Public groups</p>
              <Compass className="text-emerald-400" size={20} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">
              {loading ? "—" : publicCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Open learning communities
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#111526] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Private groups</p>
              <BookOpen className="text-amber-400" size={20} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">
              {loading ? "—" : privateCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Restricted communities
            </p>
          </div>
        </section>

        {/* SUCCESS MESSAGE */}

        {actionMessage && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {actionMessage}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>

            <button
              onClick={fetchGroups}
              className="flex items-center gap-2 text-sm font-semibold text-red-300 hover:text-white"
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        {/* GROUP LIST */}

        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-xl font-bold text-white">
                Your communities
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage and explore your joined study groups.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#111526] px-4">
                <Search size={17} className="shrink-0 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your groups..."
                  className="h-11 w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-56"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111526] px-3">
                <Filter size={16} className="text-slate-500" />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="h-11 bg-transparent text-sm text-slate-300 outline-none"
                >
                  <option value="all" className="bg-[#111526]">
                    All groups
                  </option>
                  <option value="public" className="bg-[#111526]">
                    Public
                  </option>
                  <option value="private" className="bg-[#111526]">
                    Private
                  </option>
                </select>
              </div>

              <button
                onClick={fetchGroups}
                disabled={loading}
                title="Refresh groups"
                className="flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#111526] px-4 text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[290px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111526] p-5"
                >
                  <div className="h-12 w-12 rounded-xl bg-white/5" />
                  <div className="mt-6 h-4 w-2/3 rounded bg-white/5" />
                  <div className="mt-4 h-3 w-full rounded bg-white/5" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-white/5" />
                  <div className="mt-10 h-10 rounded-xl bg-white/5" />
                </div>
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#111526]/60 px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                {search || filter !== "all" ? (
                  <Search size={28} />
                ) : (
                  <Users size={28} />
                )}
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">
                {groups.length === 0
                  ? "Your learning journey starts here"
                  : "No matching groups found"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {groups.length === 0
                  ? "You haven't joined any study groups yet. Discover a community or create one and start learning together."
                  : "Try a different search term or change your privacy filter."}
              </p>

              {groups.length === 0 ? (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => navigate("/discover")}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                  >
                    <Compass size={16} />
                    Discover groups
                  </button>

                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    <Plus size={16} />
                    Create your first group
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="mt-5 text-sm font-semibold text-violet-400 hover:text-violet-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-slate-500">
                Showing {filteredGroups.length} of {groups.length} groups
              </p>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    currentUserId={user?.id || user?._id}
                    leaving={leavingId === group._id}
                    onLeave={() => leaveGroup(group)}
                    onOpen={() =>
                      navigate(`/groups/${group._id}`)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <CreateGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createGroup}
        submitting={creating}
      />
    </DashboardLayout>
  );
}
