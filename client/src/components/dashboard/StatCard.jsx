
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "violet",
  trend,
  trendLabel = "vs. last month",
}) {
  const themes = {
    violet: {
      icon: "bg-violet-500/15 text-violet-400",
      glow: "group-hover:border-violet-400/30",
    },
    blue: {
      icon: "bg-blue-500/15 text-blue-400",
      glow: "group-hover:border-blue-400/30",
    },
    emerald: {
      icon: "bg-emerald-500/15 text-emerald-400",
      glow: "group-hover:border-emerald-400/30",
    },
    amber: {
      icon: "bg-amber-500/15 text-amber-400",
      glow: "group-hover:border-amber-400/30",
    },
  };

  const theme = themes[color] || themes.violet;
  const positiveTrend = trend !== undefined && Number(trend) >= 0;

  return (
    <article
      className={`group rounded-2xl border border-white/[0.07] bg-[#111526] p-5 transition duration-300 hover:-translate-y-1 hover:bg-[#151a2e] ${theme.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.icon}`}>
          {Icon && <Icon size={21} />}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              positiveTrend ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {positiveTrend ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {Math.abs(Number(trend))}%
          </span>
        )}

        <span className="text-slate-500">
          {trend !== undefined ? trendLabel : description}
        </span>
      </div>
    </article>
  );
}
