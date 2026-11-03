
import { motion } from "framer-motion";
import { BookOpen, Users, Sparkles, ArrowUpRight } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="min-h-screen bg-[#080b16] text-white lg:grid lg:grid-cols-2">

      {/* LEFT SECTION — UNCHANGED */}
      <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#0d1020] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500">
            <BookOpen size={23} />
          </div>
          <span className="text-2xl font-bold">
            Study<span className="text-violet-400">Circle</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-xl"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-300">
            <Sparkles size={15} />
            Learn better, together
          </div>

          <h1 className="text-5xl font-bold leading-tight xl:text-6xl">
            Your next big idea starts with
            <span className="text-violet-400"> collaboration.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-slate-400">
            Find your people, exchange knowledge, share resources, and turn
            your learning goals into achievements.
          </p>

          <div className="mt-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Users size={23} />
            </div>
            <div>
              <p className="font-semibold">Better learning happens together.</p>
              <p className="mt-1 text-sm text-slate-400">
                Connect. Collaborate. Grow.
              </p>
            </div>
            <ArrowUpRight className="ml-auto text-slate-500" />
          </div>
        </motion.div>

        <p className="relative z-10 text-sm text-slate-500">
          © {new Date().getFullYear()} StudyCircle. Built for curious minds.
        </p>
      </section>

      {/* RIGHT SECTION — REDESIGNED */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b16] px-5 py-10 sm:px-10 lg:px-12">

        {/* Ambient purple lighting */}
        <div className="pointer-events-none absolute left-[8%] top-[10%] h-72 w-72 rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="pointer-events-none absolute bottom-[5%] right-[5%] h-80 w-80 rounded-full bg-purple-600/20 blur-[130px]" />

        {/* Mobile branding */}
        <div className="absolute left-6 top-6 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500">
            <BookOpen size={21} />
          </div>
          <span className="text-xl font-bold">
            Study<span className="text-violet-400">Circle</span>
          </span>
        </div>

        {/* Glass authentication card */}
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 w-full max-w-[580px] pt-12 lg:pt-0"
        >
          {/* CARD CONTAINER */}
          <div className="relative overflow-hidden rounded-[28px] border border-violet-300/25 bg-gradient-to-br from-[#25233d]/95 via-[#191b30]/95 to-[#171629]/95 p-6 shadow-[0_25px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-9 lg:p-12">

            {/* Subtle glass highlights */}
            <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/[0.04]" />

            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-[100px]" />

            <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-purple-600/20 blur-[100px]" />

            <div className="relative z-10">

              {/* Authentication heading */}
              <div className="mb-7 text-center">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-violet-300">
                  Welcome to StudyCircle
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                  {title}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  {subtitle}
                </p>
              </div>

              {/* Login / Register content */}
              {children}

            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
