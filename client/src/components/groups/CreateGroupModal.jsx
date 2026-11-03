
import { useState } from "react";
import {
  X,
  Users,
  BookOpen,
  LockKeyhole,
  Globe2,
  Plus,
  Loader2,
  Tag,
} from "lucide-react";

const initialForm = {
  name: "",
  description: "",
  subject: "",
  privacy: "public",
  tags: "",
  maxMembers: "50",
};

export default function CreateGroupModal({
  open,
  onClose,
  onCreate,
  submitting = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  if (!open) return null;

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 3 || form.name.trim().length > 80) {
      setError("Group name must contain 3 to 80 characters.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a group description.");
      return;
    }

    if (form.description.trim().length > 500) {
      setError("Description must be 500 characters or fewer.");
      return;
    }

    if (!form.subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    const maxMembers = Number(form.maxMembers);

    if (
      !Number.isInteger(maxMembers) ||
      maxMembers < 2 ||
      maxMembers > 500
    ) {
      setError("Maximum members must be between 2 and 500.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      privacy: form.privacy,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      maxMembers,
    };

    try {
      await onCreate(payload);
      setForm(initialForm);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to create group."
      );
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e1b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#111526] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/[0.07] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Users size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Create a study group
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Build a community around what you're learning.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="text-sm font-medium text-slate-300">
              Group name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              maxLength={80}
              placeholder="e.g. Full Stack Developers"
              className={inputClass}
              required
            />
            <p className="mt-1 text-right text-[11px] text-slate-600">
              {form.name.length}/80
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">
              Subject *
            </label>
            <div className="relative">
              <BookOpen
                size={17}
                className="absolute left-4 top-[25px] text-slate-500"
              />
              <input
                name="subject"
                value={form.subject}
                onChange={updateField}
                placeholder="e.g. Web Development"
                className={`${inputClass} pl-11`}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              maxLength={500}
              rows={4}
              placeholder="What will members learn or work on together?"
              className={`${inputClass} resize-none`}
              required
            />
            <p className="mt-1 text-right text-[11px] text-slate-600">
              {form.description.length}/500
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300">
                Group privacy
              </label>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      privacy: "public",
                    }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm transition ${
                    form.privacy === "public"
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-300"
                      : "border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Globe2 size={16} />
                  Public
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      privacy: "private",
                    }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm transition ${
                    form.privacy === "private"
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-300"
                      : "border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <LockKeyhole size={16} />
                  Private
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">
                Maximum members
              </label>
              <div className="relative">
                <Users
                  size={17}
                  className="absolute left-4 top-[25px] text-slate-500"
                />
                <input
                  type="number"
                  name="maxMembers"
                  value={form.maxMembers}
                  onChange={updateField}
                  min="2"
                  max="500"
                  className={`${inputClass} pl-11`}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Tag size={15} />
              Tags
            </label>
            <input
              name="tags"
              value={form.tags}
              onChange={updateField}
              placeholder="React, JavaScript, Projects"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-600">
              Separate tags with commas.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
