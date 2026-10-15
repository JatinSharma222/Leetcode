import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Lock, User, ArrowRight, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthCredentials() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (activeTab === "signup") {
      if (trimmedUsername.length < 3) {
        setError("Username must be at least 3 characters.");
        return;
      }
      if (trimmedUsername.length > 30) {
        setError("Username must be at most 30 characters.");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        setError("Username can only contain letters, numbers, and underscores.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "signin") {
        await login(trimmedUsername, password);
      } else {
        await register(trimmedUsername, password);
      }
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 sm:p-10 rounded-2xl bg-surface-elevated/90 backdrop-blur-xl shadow-2xl relative overflow-hidden border border-white/5">
      {/* Top Accent Light Sweep */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-80" />

      {/* Header & Segmented Tabs */}
      <div className="space-y-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">
              {activeTab === "signin" ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-xs text-text-muted mt-1 font-sans">
              {activeTab === "signin"
                ? "Enter your credentials to access the coding environment."
                : "Register a handle to start solving problems and tracking submissions."}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center border border-white/5 text-text-muted">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        {/* Segmented Control */}
        <div className="relative grid grid-cols-2 p-1 rounded-xl bg-surface-base shadow-inner border border-white/5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("signin");
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "signin"
                ? "text-text-primary bg-surface-hover shadow-xs"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "signup"
                ? "text-text-primary bg-surface-hover shadow-xs"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-status-error/30 bg-status-error/10 p-3 text-xs text-status-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary flex justify-between">
            <span>Username</span>
            <span className="font-mono text-[10px] text-text-muted">
              {activeTab === "signup" ? "min 3 chars, letters & numbers" : "required"}
            </span>
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              className="w-full bg-surface-base text-text-primary placeholder:text-text-muted text-xs pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner transition-colors duration-150 border border-white/5"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary flex justify-between">
            <span>Password</span>
            <span className="font-mono text-[10px] text-text-muted">
              {activeTab === "signup" ? "min 8 characters" : "required"}
            </span>
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete={activeTab === "signin" ? "current-password" : "new-password"}
              className="w-full bg-surface-base text-text-primary placeholder:text-text-muted text-xs pl-10 pr-10 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner transition-colors duration-150 border border-white/5"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Informational Prompt */}
        <div className="pt-1 text-[11px] text-text-muted flex items-center gap-1.5">
          <span className="text-status-warning">⚡</span>
          <span>Access interactive code execution, custom test vectors, and submission tracking.</span>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-container hover:bg-brand-wine-deep text-on-primary-container text-xs font-semibold tracking-wide transition-all shadow-[0_0_24px_-4px_rgba(225,29,72,0.45)] hover:shadow-[0_0_32px_0px_rgba(225,29,72,0.6)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Authenticating...</span>
            </div>
          ) : (
            <>
              <span>{activeTab === "signin" ? "Sign In to AtelierCode" : "Create Account"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}