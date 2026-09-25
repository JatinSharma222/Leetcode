import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { LogOut, Search, Bell, Sparkles } from "lucide-react";
import AtelierLogo from "./AtelierLogo";
import { signOut, getSavedUsername } from "@/lib/api";

interface NavbarProps {
  onSearchFocus?: () => void;
}

export default function Navbar({ onSearchFocus }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = getSavedUsername() || "Developer";
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => {
    if (path === "/" && (location.pathname === "/" || location.pathname.startsWith("/problem"))) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0B0B0F]/90 backdrop-blur-md shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-14 max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Brand Identity & Nav Tabs */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <AtelierLogo size={32} />
            <span className="font-headline-sm text-base sm:text-lg font-bold tracking-tight text-text-primary">
              AtelierCode
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-surface-elevated px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted border border-white/5">
              v2.4 Live Judge
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive("/")
                  ? "bg-surface-hover text-text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"
              }`}
            >
              Problems
            </Link>

            <Link
              to="/submissions"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive("/submissions")
                  ? "bg-surface-hover text-text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"
              }`}
            >
              Submissions
            </Link>

            <button
              type="button"
              onClick={() => alert("Contest arena opens every Saturday at 14:00 UTC!")}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 cursor-pointer transition-all"
            >
              Contests
            </button>

            <button
              type="button"
              onClick={() => alert("Leaderboard features Global Titan League rankings.")}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 cursor-pointer transition-all"
            >
              Leaderboard
            </button>
          </nav>
        </div>

        {/* Center: Command Search Input */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-2">
          <div
            onClick={onSearchFocus}
            className="w-full flex items-center bg-surface-elevated rounded-lg px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-inner"
          >
            <Search className="h-3.5 w-3.5 text-text-muted mr-2 shrink-0" />
            <span className="text-xs text-text-muted select-none flex-1 truncate">
              Search problems, algorithms, tags...
            </span>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-base text-text-muted border border-white/10 select-none shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Gamified Badges, Notifications, and Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Consistency Streak Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/20 shadow-[0_0_12px_-2px_rgba(245,158,11,0.25)] select-none">
            <span className="text-xs leading-none">🔥</span>
            <span className="font-mono text-xs font-semibold tracking-tight">14 Days</span>
          </div>

          {/* Level & XP Pill */}
          <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-surface-elevated border border-white/10 text-text-secondary font-mono text-xs select-none">
            <span className="text-text-primary font-semibold mr-1.5">Lv. 8</span>
            <span className="text-text-muted mr-1.5">•</span>
            <span className="text-tertiary font-semibold flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5 text-tertiary" /> 2,450 XP
            </span>
          </div>

          {/* Notifications button */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-hover transition-colors flex items-center justify-center cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface-base" />
          </button>

          {/* Profile Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-full p-0.5 hover:ring-1 hover:ring-primary-container transition-all cursor-pointer"
            >
              <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-brand-wine-deep to-primary-container flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {username.slice(0, 2).toUpperCase()}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-status-accepted ring-2 ring-surface-base" />
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-surface-elevated p-2 shadow-2xl z-50 backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs font-semibold text-text-primary truncate">{username}</p>
                  <p className="font-mono text-[10px] text-text-muted">Mastery Rank: Titan III</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-status-error hover:bg-surface-hover rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}