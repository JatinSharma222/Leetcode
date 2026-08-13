import React from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Code2, LogOut, CheckCircle2, User, Layers } from "lucide-react";
import { Button } from "./button";
import { clearAuthToken } from "@/lib/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem("username") || "Developer";

  const handleLogout = () => {
    clearAuthToken();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900 transition-opacity hover:opacity-90 dark:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm shadow-orange-500/30">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">
              Code<span className="text-orange-500">Space</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800/80 dark:text-white font-semibold"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-4 w-4 text-orange-500/90" />
              Problems
            </Link>

            <Link
              to="/submissions"
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive("/submissions")
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800/80 dark:text-white font-semibold"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500/90" />
              Submissions
            </Link>
          </nav>
        </div>

        {/* Right: User profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-l border-neutral-200 pl-3 dark:border-neutral-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-neutral-700 dark:text-neutral-300 max-w-[100px] truncate">
              {username}
            </span>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Log out"
              className="text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}