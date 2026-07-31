import React, { useState, useCallback } from "react"
import { Eye, EyeOff, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// ─── Config ────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// ─── Types ─────────────────────────────────────────────────────────────────
interface AuthSuccessPayload {
  token?: string;
  [key: string]: unknown;
}

interface AuthCredentialsProps {
  /** Called after a successful login or signup. Defaults to storing the
   *  token and reloading, but callers should generally own navigation. */
  onAuthSuccess?: (payload: AuthSuccessPayload) => void;
}

type FieldErrors = Record<string, string>;

// ─── Small reusable pieces ──────────────────────────────────────────────────

function FormField({
  id,
  label,
  error,
  children,
  trailing,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </Label>
        {trailing}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  visible,
  onToggleVisible,
  hasError,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  hasError: boolean;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 pr-10 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}



export default function AuthCredentials({ onAuthSuccess }: AuthCredentialsProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupFirst, setSignupFirst] = useState("");
  const [signupLast, setSignupLast] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const defaultAuthSuccess = useCallback((payload: AuthSuccessPayload) => {
    if (payload.token) localStorage.setItem("token", payload.token as string);
    window.location.reload();
  }, []);

  const handleAuthSuccess = onAuthSuccess ?? defaultAuthSuccess;

  const resetErrors = () => {
    setFormError(null);
    setFieldErrors({});
  };

  const validateLogin = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(loginEmail)) errors.email = "Enter a valid email address.";
    if (!loginPassword) errors.password = "Enter your password.";
    return errors;
  };

  const validateSignup = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!signupFirst.trim()) errors.firstName = "Enter your first name.";
    if (!signupLast.trim()) errors.lastName = "Enter your last name.";
    if (!EMAIL_PATTERN.test(signupEmail)) errors.email = "Enter a valid email address.";
    if (signupPassword.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return errors;
  };

  // Shared submit logic for both tabs — only the endpoint and body differ.
  const submitAuth = useCallback(
    async (endpoint: "signin" | "signup", body: Record<string, string>) => {
      resetErrors();
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        let data: AuthSuccessPayload = {};
        try {
          data = await res.json();
        } catch {
          // Non-JSON response; fall through to status-based error below.
        }

        if (!res.ok) {
          throw new Error((data.message as string) || "Something went wrong. Please try again.");
        }

        handleAuthSuccess(data);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const handleLoginSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateLogin();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    submitAuth("signin", { email: loginEmail, password: loginPassword });
  };

  const handleSignupSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateSignup();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    submitAuth("signup", {
      firstName: signupFirst,
      lastName: signupLast,
      email: signupEmail,
      password: signupPassword,
    });
  };

  return (
    <div id="auth-credentials" className="flex items-center justify-center">
      <Card className="w-full max-w-[420px] rounded-2xl border border-neutral-200/80 bg-white p-0 shadow-xl shadow-neutral-200/50">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle className="text-xl font-semibold text-neutral-900">
            {activeTab === "login" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-sm text-neutral-500">
            {activeTab === "login"
              ? "Enter your credentials to access your workspace."
              : "Get started with a free account."}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as "login" | "signup");
              resetErrors();
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg bg-neutral-100 p-1 h-10">
              <TabsTrigger
                id="tab-login"
                value="login"
                className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-500"
              >
                Log in
              </TabsTrigger>
              <TabsTrigger
                id="tab-signup"
                value="signup"
                className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-500"
              >
                Sign up
              </TabsTrigger>
            </TabsList>

            {/* ─── Login Tab ─── */}
            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                <FormField id="login-email" label="Email" error={fieldErrors.email}>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                  />
                </FormField>

                <FormField
                  id="login-password"
                  label="Password"
                  error={fieldErrors.password}
                  trailing={
                    <button
                      type="button"
                      className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-800"
                    >
                      Forgot password?
                    </button>
                  }
                >
                  <PasswordInput
                    id="login-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    visible={showPassword}
                    onToggleVisible={() => setShowPassword((v) => !v)}
                    hasError={!!fieldErrors.password}
                  />
                </FormField>

                {formError && (
                  <p role="alert" className="text-sm text-red-600">
                    {formError}
                  </p>
                )}

                <Button
                  id="btn-login"
                  type="submit"
                  className="mt-2 h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Log in"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>

                <div className="relative my-1">
                  <Separator className="bg-neutral-200" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-neutral-400">
                    or
                  </span>
                </div>

                <Button
                  id="btn-login-github"
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-lg border-neutral-200 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 active:scale-[0.98]"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </Button>
              </form>
            </TabsContent>

            {/* ─── Sign Up Tab ─── */}
            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignupSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField id="signup-firstname" label="First name" error={fieldErrors.firstName}>
                    <Input
                      id="signup-firstname"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Jane"
                      value={signupFirst}
                      onChange={(e) => setSignupFirst(e.target.value)}
                      aria-invalid={!!fieldErrors.firstName}
                      className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                    />
                  </FormField>
                  <FormField id="signup-lastname" label="Last name" error={fieldErrors.lastName}>
                    <Input
                      id="signup-lastname"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Doe"
                      value={signupLast}
                      onChange={(e) => setSignupLast(e.target.value)}
                      aria-invalid={!!fieldErrors.lastName}
                      className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                    />
                  </FormField>
                </div>

                <FormField id="signup-email" label="Email" error={fieldErrors.email}>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    aria-invalid={!!fieldErrors.email}
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                  />
                </FormField>

                <FormField id="signup-password" label="Password" error={fieldErrors.password}>
                  <PasswordInput
                    id="signup-password"
                    placeholder="Min. 8 characters"
                    value={signupPassword}
                    onChange={setSignupPassword}
                    visible={showPassword}
                    onToggleVisible={() => setShowPassword((v) => !v)}
                    hasError={!!fieldErrors.password}
                  />
                </FormField>

                {formError && (
                  <p role="alert" className="text-sm text-red-600">
                    {formError}
                  </p>
                )}

                <Button
                  id="btn-signup"
                  type="submit"
                  className="mt-2 h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Create account"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>

                <p className="text-center text-xs leading-relaxed text-neutral-400">
                  By signing up you agree to our{" "}
                  <button
                    type="button"
                    className="font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-800"
                  >
                    Terms
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-800"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}