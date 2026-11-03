
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  BookOpen,
  Globe2,
  LockKeyhole,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Compass,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Tag,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../lib/api";

const PAGE_SIZE = 9;

const subjects = [
  "All subjects",
  "Web Development",
  "Programming",
  "Data Structures",
  "Artificial Intelligence",
  "Machine Learning",
  "Database Management",
  "Cybersecurity",
  "Cloud Computing",
  "Other",
];

export default function DiscoverGroups() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All subjects");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);

  const [totalGroups, setTotalGroups] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchJoinedGroups = useCallback(async () => {
    try {
      const response = await api.get("/dashboard");

      const ids = (response.data.joinedGroups || []).map(
        (group) => group._id.toString()
      );

      setJoinedIds(ids);
    } catch (err) {
      console.error("Unable to fetch joined groups:", err);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (subject !== "All subjects") {
        params.subject = subject;
      }

      if (tag.trim()) {
        params.tag = tag.trim();
      }

      const response = await api.get("/groups", { params });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to discover groups."
        );
      }

      setGroups(response.data.groups || []);
      setTotalGroups(response.data.totalGroups || 0);
      setTotalPages(Math.max(response.data.totalPages || 1, 1));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load study groups."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, subject, tag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups();
    }, search ? 400 : 0);

    return () => clearTimeout(timer);
  }, [fetchGroups, search]);

  useEffect(() => {
    fetchJoinedGroups();
  }, [fetchJoinedGroups]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
    setSuccess("");
  };

  const handleSubject = (value) => {
    setSubject(value);
    setPage(1);
  };

  const handleTag = (value) => {
    setTag(value);
    setPage(1);
  };

  const joinGroup = async (group) => {
    setJoiningId(group._id);
    setError("");
    setSuccess("");

    try {
      const response = group.privacy === "private"
        ? await api.post(`/member-management/${group._id}/request`)
        : await api.post(`/groups/${group._id}/join`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to join this group."
        );
      }

      if (group.privacy === "private") {
        setSuccess(`Your request to join ${group.name} has been submitted. An admin must approve it.`);
      } else {
        setJoinedIds((current) => [
          ...new Set([...current, group._id.toString()]),
        ]);
        setGroups((current) => current.map((item) => item._id === group._id
          ? { ...item, memberCount: response.data.memberCount }
          : item));
        setSuccess(`You successfully joined ${group.name}!`);
        await fetchJoinedGroups();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to join this group."
      );
    } finally {
      setJoiningId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSubject("All subjects");
    setTag("");
    setPage(1);
  };

  const showingFrom =
    totalGroups === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const showingTo = Math.min(page * PAGE_SIZE, totalGroups);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* HERO */}

        <section className="relative overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-r from-[#191635] via-[#17172e] to-[#101c34] p-7 sm:p-9">
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-violet-500/15 blur-[90px]" />
          <div className="absolute bottom-[-100px] right-[25%] h-60 w-60 rounded-full bg-blue-500/10 blur-[80px]" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <Compass size={14} />
                EXPLORE COMMUNITIES
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Find your people.
                <span className="block text-violet-400">
                  Learn together.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                Discover communities built around your interests.
                Share knowledge, solve problems and grow together
                with fellow learners.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-slate-300">
                  <Users size={16} className="text-violet-300" />
                  {totalGroups} public communities
                </span>

                <button
                  onClick={() => navigate("/groups")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
                >
                  My groups
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>

            <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-full border border-violet-300/15 bg-violet-300/[0.05] md:flex">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-violet-300/20 bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-violet-200">
                <Users size={42} strokeWidth={1.4} />
              </div>
            </div>
          </div>
        </section>

        {/* ALERTS */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
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

        {/* SEARCH AND FILTERS */}

        <section className="rounded-2xl border border-white/[0.07] bg-[#111526] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-violet-400" />
            <h2 className="font-semibold text-white">
              Find your community
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="relative lg:col-span-6">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Search groups, subjects or keywords..."
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0b0e1b] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50"
              />
            </div>

            <div className="lg:col-span-3">
              <select
                value={subject}
                onChange={(event) => handleSubject(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0b0e1b] px-4 text-sm text-slate-300 outline-none focus:border-violet-400/50"
              >
                {subjects.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#111526]"
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative lg:col-span-3">
              <Tag
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={tag}
                onChange={(event) => handleTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    fetchGroups();
                  }
                }}
                placeholder="Filter by tag..."
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0b0e1b] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Discover public groups matching your interests.
            </p>

            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-violet-400 transition hover:text-violet-300"
            >
              Clear all filters
            </button>
          </div>
        </section>

        {/* RESULTS HEADER */}

        <section>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold text-white">
                Explore study groups
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Find a community that matches your learning goals.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Globe2 size={15} />
              Public communities
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-[310px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111526] p-5"
                >
                  <div className="h-12 w-12 rounded-xl bg-white/5" />
                  <div className="mt-6 h-3 w-1/3 rounded bg-white/5" />
                  <div className="mt-3 h-5 w-2/3 rounded bg-white/5" />
                  <div className="mt-4 h-3 w-full rounded bg-white/5" />
                  <div className="mt-3 h-3 w-4/5 rounded bg-white/5" />
                  <div className="mt-12 h-10 rounded-xl bg-white/5" />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#111526]/60 px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <Compass size={30} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">
                No communities found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn't find public groups matching your filters.
                Try another subject or search term.
              </p>

              <button
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-slate-500">
                Showing {showingFrom}–{showingTo} of {totalGroups} communities
              </p>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {groups.map((group) => {
                  const isJoined = joinedIds.includes(
                    group._id.toString()
                  );

                  const memberCount =
                    group.memberCount ??
                    (Array.isArray(group.members)
                      ? group.members.length
                      : 0);

                  const isFull =
                    memberCount >= (group.maxMembers || 50);

                  const isJoining = joiningId === group._id;

                  return (
                    <article
                      key={group._id}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111526] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-[#151a2e]"
                    >
                      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-500/[0.06] blur-3xl transition group-hover:bg-violet-500/15" />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-300">
                            <BookOpen size={22} />
                          </div>

                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                            <Globe2 size={11} />
                            Public
                          </span>
                        </div>

                        <div className="mt-5">
                          <p className="text-xs font-medium text-violet-400">
                            {group.subject || "General learning"}
                          </p>

                          <h3 className="mt-2 line-clamp-1 text-lg font-bold text-white">
                            {group.name}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-slate-400">
                            {group.description}
                          </p>
                        </div>

                        {Array.isArray(group.tags) &&
                          group.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {group.tags.slice(0, 3).map((item) => (
                                <span
                                  key={item}
                                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400"
                                >
                                  #{item}
                                </span>
                              ))}
                            </div>
                          )}

                        <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Users size={15} className="text-slate-500" />
                            {memberCount} / {group.maxMembers || 50} members
                          </div>

                          <span className="text-[10px] text-slate-600">
                            {group.createdBy?.name
                              ? `By ${group.createdBy.name}`
                              : "StudyCircle member"}
                          </span>
                        </div>

                        <div className="mt-4">
                          {isJoined ? (
                            <button
                              onClick={() => navigate("/groups")}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15"
                            >
                              <CheckCircle2 size={17} />
                              Already joined
                            </button>
                          ) : (
                            <button
                              onClick={() => joinGroup(group)}
                              disabled={isJoining || isFull}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isJoining ? (
                                <>
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
                                  Joining...
                                </>
                              ) : isFull ? (
                                "Group is full"
                              ) : (
                                <>
                                  Join community
                                  <ArrowUpRight size={16} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* PAGINATION */}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={15} />
                  Previous
                </button>

                <button
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* BOTTOM CTA */}

        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-violet-400/15 bg-gradient-to-r from-violet-500/[0.08] to-blue-500/[0.05] p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-white">
              Have an idea for a community?
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Start your own study group and bring learners together.
            </p>
          </div>

          <button
            onClick={() => navigate("/groups")}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
          >
            <Plus size={17} />
            Create a group
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
}
