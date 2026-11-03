
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({
  label,
  type = "text",
  icon: Icon,
  placeholder,
  value,
  onChange,
  name,
  required = true,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-white"
      >
        {label}
      </label>

      <div className="group flex h-[46px] items-center rounded-xl border border-white/[0.14] bg-white/[0.035] transition-all duration-300 hover:border-violet-400/30 focus-within:border-violet-400/70 focus-within:bg-violet-500/[0.06] focus-within:shadow-[0_0_20px_rgba(139,92,246,0.12)]">

        {Icon && (
          <Icon
            size={18}
            className="ml-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-violet-300"
          />
        )}

        <input
          id={name}
          name={name}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="auth-dark-input h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-slate-500"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="mr-4 flex shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-violet-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
