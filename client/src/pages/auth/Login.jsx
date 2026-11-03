
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to sign in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Your learning community is waiting for you."
    >
      <div className="mb-7">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
          <Sparkles size={14} />
          YOUR CAMPUS, CONNECTED
        </div>

        <h3 className="text-2xl font-semibold tracking-tight text-white">
          Sign in to StudyCircle
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Continue collaborating, sharing ideas, and achieving more together.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Email address"
          name="email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
        />

        <AuthInput
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Your account is protected.
          </span>

          <span className="text-violet-300">
            Secure sign in
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-4 font-semibold text-white shadow-lg shadow-violet-900/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={19} />
              Signing in...
            </>
          ) : (
            <>
              Sign in to your account
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">
          NEW TO STUDYCIRCLE?
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Link
        to="/register"
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3.5 text-sm font-semibold text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
      >
        Create your account
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck size={15} className="text-emerald-400" />
        Your learning space, protected.
      </div>
    </AuthLayout>
  );
}
