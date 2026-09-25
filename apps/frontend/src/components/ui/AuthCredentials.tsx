import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Lock, User, ArrowRight, AlertTriangle } from "lucide-react";
import { signIn, signUp } from "@/lib/api";

export default function AuthCredentials() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "signin") {
        await signIn(username.trim(), password);
      } else {
        await signUp(username.trim(), password);
      }
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = (provider: string) => {
    setError(`${provider} login will be configured with production OAuth client credentials.`);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 sm:p-10 rounded-2xl bg-surface-elevated/90 backdrop-blur-xl shadow-2xl relative overflow-hidden border border-white/5">
      {/* Top Accent Light Sweep */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-80" />

      {/* Header & Segmented Tabs */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">
              Enter Sandbox
            </h2>
            <p className="text-xs text-text-muted mt-1 font-sans">
              Select credentials to access computational runtime.
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

      {/* Fast Social OAuth */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleSocialClick("GitHub")}
          className="group flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-surface-hover hover:bg-surface-container-high transition-all duration-150 shadow-xs active:scale-[0.98] border border-white/5 cursor-pointer"
        >
          <svg className="w-4 h-4 fill-text-primary group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
            <path
              clipRule="evenodd"
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span className="text-xs font-semibold text-text-primary">GitHub</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialClick("Google")}
          className="group flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-surface-hover hover:bg-surface-container-high transition-all duration-150 shadow-xs active:scale-[0.98] border border-white/5 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z" fill="#EA4335" />
            <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" fill="#4285F4" />
            <path d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" fill="#FBBC05" />
            <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z" fill="#34A853" />
          </svg>
          <span className="text-xs font-semibold text-text-primary">Google</span>
        </button>
      </div>

      {/* Visual Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="w-full h-px bg-white/5" />
        <span className="absolute px-3 bg-surface-elevated font-mono text-[10px] text-text-muted uppercase tracking-widest">
          or continue with username
        </span>
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
            <span className="font-mono text-[10px] text-text-muted">required</span>
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="elena_dev"
              className="w-full bg-surface-base text-text-primary placeholder:text-text-muted text-xs pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner transition-colors duration-150 border border-white/5"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary flex justify-between">
            <span>Password</span>
            <span className="font-mono text-[10px] text-text-muted">min 6 chars</span>
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-surface-base text-text-primary placeholder:text-text-muted text-xs pl-10 pr-10 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner transition-colors duration-150 border border-white/5"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* High-Retention Prompt */}
        <div className="pt-1 text-[11px] text-text-muted flex items-center gap-1.5">
          <span className="text-status-warning">🔥</span>
          <span>Sign up today to start your 7-day challenge streak.</span>
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
              <span>Connecting to judge...</span>
            </div>
          ) : (
            <>
              <span>{activeTab === "signin" ? "Enter Sandbox" : "Create Account"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}