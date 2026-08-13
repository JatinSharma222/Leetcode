import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

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
import { signIn, signUp } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = Record<string, string>;


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

export default function AuthCredentials() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const resetErrors = () => {
    setFormError(null);
    setFieldErrors({});
  };

  const validateLogin = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!loginUsername.trim()) errors.username = "Enter your username.";
    if (!loginPassword) errors.password = "Enter your password.";
    return errors;
  };

  const validateSignup = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!signupUsername.trim()) errors.username = "Enter your username.";
    if (signupPassword.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return errors;
  };

  const handleLoginSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateLogin();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    resetErrors();
    setLoading(true);
    try {
      // signIn stores the token AND decodes+stores the username from it —
      // the backend's /auth/signin response only ever contains a token, no
      // username field, so this is the only real source for it.
      await signIn(loginUsername, loginPassword);
      navigate("/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateSignup();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    resetErrors();
    setLoading(true);
    try {
      // /auth/signup doesn't return a token (only /auth/signin does), so
      // there's no way to log the user straight in here. Hand them to the
      // login tab instead of silently doing nothing.
      await signUp(signupUsername, signupPassword);
      setLoginUsername(signupUsername);
      setSignupPassword("");
      setSignupSuccessMessage("Account created — log in below to continue.");
      setActiveTab("login");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
              setSignupSuccessMessage(null);
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
                {signupSuccessMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {signupSuccessMessage}
                  </div>
                )}

                <FormField id="login-username" label="Username" error={fieldErrors.username}>
                  <Input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    placeholder="your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby={fieldErrors.username ? "login-username-error" : undefined}
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                  />
                </FormField>

                <FormField id="login-password" label="Password" error={fieldErrors.password}>
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
              </form>
            </TabsContent>

            {/* ─── Sign Up Tab ─── */}
            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignupSubmit} noValidate className="space-y-4">
                <FormField id="signup-username" label="Username" error={fieldErrors.username}>
                  <Input
                    id="signup-username"
                    type="text"
                    autoComplete="username"
                    placeholder="your username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby={fieldErrors.username ? "signup-username-error" : undefined}
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
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}