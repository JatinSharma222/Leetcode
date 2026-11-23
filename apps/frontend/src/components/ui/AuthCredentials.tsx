import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";

import AtelierLogo from "./AtelierLogo";
import { Button } from "./button";
import { Input } from "./input";
import { useAuth } from "@/context/AuthContext";
import { usePageTitle } from "@/lib/usePageTitle";

type AuthMode = "signin" | "signup";

export default function AuthCredentials() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageTitle(mode === "signin" ? "Sign in" : "Create account");

  const validate = (): string | null => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      return "Enter your username and password.";
    }

    if (mode === "signup") {
      if (trimmedUsername.length < 3) {
        return "Username must be at least 3 characters.";
      }
      if (trimmedUsername.length > 30) {
        return "Username must be at most 30 characters.";
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        return "Username can only contain letters, numbers, and underscores.";
      }
      if (password.length < 8) {
        return "Password must be at least 8 characters.";
      }
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        to="/"
        className="mb-8 flex items-center justify-center gap-2.5 lg:hidden"
        aria-label="AtelierCode home"
      >
        <AtelierLogo size={30} />
        <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
          AtelierCode
        </span>
      </Link>

      <div className="rounded-xl border border-border-hairline bg-surface-elevated p-6 shadow-xl sm:p-8">
        <div className="mb-6 space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-text-secondary">
            {mode === "signin"
              ? "Continue to your problem set and submissions."
              : "Create an account to start practicing."}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Authentication mode"
          className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border-hairline bg-surface-base p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            onClick={() => switchMode("signin")}
            className={`h-8 rounded-md text-xs font-medium transition-colors ${
              mode === "signin"
                ? "bg-surface-hover text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => switchMode("signup")}
            className={`h-8 rounded-md text-xs font-medium transition-colors ${
              mode === "signup"
                ? "bg-surface-hover text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Sign up
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-status-error/30 bg-status-error/10 p-3 text-xs text-status-error"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="auth-username" className="text-xs font-medium text-text-secondary">
                Username
              </label>
              {mode === "signup" ? (
                <span className="text-[11px] text-text-muted">3–30 characters</span>
              ) : null}
            </div>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="auth-username"
                name="username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your username"
                className="h-10 pl-9 text-base sm:text-sm"
                aria-invalid={Boolean(error)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="auth-password" className="text-xs font-medium text-text-secondary">
                Password
              </label>
              {mode === "signup" ? (
                <span className="text-[11px] text-text-muted">At least 8 characters</span>
              ) : null}
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-10 pl-9 pr-10 text-base sm:text-sm"
                aria-invalid={Boolean(error)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted transition-colors hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="mt-2 w-full"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                {mode === "signin" ? "Signing in…" : "Creating account…"}
              </>
            ) : (
              <>
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight />
              </>
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-5 text-text-muted">
          {mode === "signin"
            ? "New to AtelierCode? Select Sign up above to create an account."
            : "Already have an account? Select Sign in above."}
        </p>
      </div>
    </div>
  );
}
