
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (form.name.trim().length > 80) {
      setError("Your name cannot exceed 80 characters.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (form.password.length < 8 || form.password.length > 72) {
      setError("Password must contain between 8 and 72 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create your account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Join StudyCircle"
      subtitle="Better learning starts with better connections."
    >
      <div className="mb-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
          <Sparkles size={14} />
          START YOUR JOURNEY
        </div>

        <h3 className="text-2xl font-semibold tracking-tight text-white">
          Create your account
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Meet learners, build study groups, and grow together.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Full name"
          name="name"
          type="text"
          icon={User}
          placeholder="Your full name"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
        />

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
          placeholder="Minimum 8 characters"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <AuthInput
          label="Confirm password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />

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
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-4 font-semibold text-white shadow-lg shadow-violet-900/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={19} />
              Creating account...
            </>
          ) : (
            <>
              Create your account
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <Users size={19} className="mt-0.5 shrink-0 text-violet-400" />

        <p className="text-xs leading-5 text-slate-400">
          Join a growing learning community where students share knowledge,
          collaborate, and achieve their goals together.
        </p>
      </div>

      <p className="mt-7 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          to="/"
          className="font-semibold text-violet-400 transition hover:text-violet-300"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
