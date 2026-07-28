import { useState } from "react";
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

export default function AuthCredentials() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

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
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
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
            <TabsContent value="login" className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="login-email"
                  className="text-sm font-medium text-neutral-700"
                >
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="login-password"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-800"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 pr-10 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                id="btn-login"
                className="mt-2 h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
              >
                Log in
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
                variant="outline"
                className="h-10 w-full rounded-lg border-neutral-200 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 active:scale-[0.98]"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </Button>
            </TabsContent>

            {/* ─── Sign Up Tab ─── */}
            <TabsContent value="signup" className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-firstname"
                    className="text-sm font-medium text-neutral-700"
                  >
                    First name
                  </Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    placeholder="Jane"
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-lastname"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Last name
                  </Label>
                  <Input
                    id="signup-lastname"
                    type="text"
                    placeholder="Doe"
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="signup-email"
                  className="text-sm font-medium text-neutral-700"
                >
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="signup-password"
                  className="text-sm font-medium text-neutral-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50/50 pr-10 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                id="btn-signup"
                className="mt-2 h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
              >
                Create account
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}