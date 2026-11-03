
import {
  Users,
  LockKeyhole,
  Globe2,
  BookOpen,
  ArrowUpRight,
  LogOut,
} from "lucide-react";

export default function GroupCard({
  group,
  currentUserId,
  onLeave,
  onOpen,
  leaving = false,
}) {
  const creatorId =
    typeof group.createdBy === "object"
      ? group.createdBy?._id
      : group.createdBy;

  const isCreator = creatorId?.toString() === currentUserId?.toString();

  const memberCount = Array.isArray(group.members)
    ? group.members.length
    : group.memberCount ?? 0;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111526] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-[#151a2e]">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/[0.06] blur-3xl transition group-hover:bg-violet-500/15" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-300">
            <BookOpen size={22} />
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
              group.privacy === "private"
                ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            }`}
          >
            {group.privacy === "private" ? (
              <LockKeyhole size={11} />
            ) : (
              <Globe2 size={11} />
            )}
            {group.privacy || "public"}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-violet-400">
            {group.subject || "General learning"}
          </p>

          <h3 className="mt-2 line-clamp-1 text-lg font-bold text-white">
            {group.name}
          </h3>

          <p className="mt-2 min-h-[44px] line-clamp-2 text-sm leading-6 text-slate-400">
            {group.description || "A community for collaborative learning."}
          </p>
        </div>

        {Array.isArray(group.tags) && group.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {group.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users size={15} className="text-slate-500" />
            <span>{memberCount} members</span>
            {group.maxMembers && (
              <span className="text-slate-600">
                / {group.maxMembers}
              </span>
            )}
          </div>

          {isCreator && (
            <span className="rounded-md bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-300">
              CREATOR
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onOpen}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Open group
            <ArrowUpRight size={16} />
          </button>

          {!isCreator && (
            <button
              onClick={onLeave}
              disabled={leaving}
              title="Leave group"
              className="flex items-center justify-center rounded-xl border border-white/10 px-3 text-slate-400 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
