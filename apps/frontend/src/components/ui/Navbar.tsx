import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { LogOut, Search, Menu, X, Code2, ListOrdered, User } from "lucide-react";
import AtelierLogo from "./AtelierLogo";
import { useAuth } from "@/context/AuthContext";
import { getSavedUsername } from "@/lib/api";

interface NavbarProps {
  onSearchFocus?: () => void;
}

export default function Navbar({ onSearchFocus }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const username = user?.username || getSavedUsername() || "Developer";

  const handleLogout = async () => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    await logout();
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
              Online Judge
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
          </nav>
        </div>

        {/* Center: Command Search Input */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={onSearchFocus}
            className="w-full flex items-center bg-surface-elevated rounded-lg px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-inner text-left"
          >
            <Search className="h-3.5 w-3.5 text-text-muted mr-2 shrink-0" />
            <span className="text-xs text-text-muted select-none flex-1 truncate">
              Search problems, algorithms, tags...
            </span>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-base text-text-muted border border-white/10 select-none shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: User Status & Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Active User Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-white/5 text-xs text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-status-accepted animate-pulse" />
            <span className="font-mono text-text-primary font-medium">{username}</span>
          </div>

          {/* Profile Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              aria-label="User menu"
              className="flex items-center gap-2 rounded-full p-0.5 hover:ring-1 hover:ring-primary-container transition-all cursor-pointer"
            >
              <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-brand-wine-deep to-primary-container flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {username.slice(0, 2).toUpperCase()}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-status-accepted ring-2 ring-surface-base" />
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-surface-elevated p-2 shadow-2xl z-50 backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs font-semibold text-text-primary truncate">{username}</p>
                  <p className="font-mono text-[10px] text-text-muted mt-0.5">Signed In</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                  >
                    <Code2 className="h-3.5 w-3.5 text-primary" />
                    <span>Problems Directory</span>
                  </Link>

                  <Link
                    to="/submissions"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                  >
                    <ListOrdered className="h-3.5 w-3.5 text-status-accepted" />
                    <span>My Submissions</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-white/5">
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

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileMenu((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-white/5 bg-[#0E0E14] px-4 py-3 space-y-2">
          {onSearchFocus && (
            <button
              type="button"
              onClick={() => {
                setShowMobileMenu(false);
                onSearchFocus();
              }}
              className="w-full flex items-center bg-surface-elevated rounded-lg px-3 py-2 text-xs text-text-muted border border-white/10 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 mr-2 shrink-0" />
              <span>Search problems...</span>
            </button>
          )}

          <div className="flex flex-col gap-1 pt-1">
            <Link
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                isActive("/") ? "bg-surface-hover text-text-primary font-semibold" : "text-text-secondary"
              }`}
            >
              <Code2 className="h-4 w-4 text-primary" />
              <span>Problems</span>
            </Link>

            <Link
              to="/submissions"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                isActive("/submissions") ? "bg-surface-hover text-text-primary font-semibold" : "text-text-secondary"
              }`}
            >
              <ListOrdered className="h-4 w-4 text-status-accepted" />
              <span>Submissions</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-status-error hover:bg-surface-hover text-left cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}