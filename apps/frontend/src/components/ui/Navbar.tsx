import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Code2, ListOrdered, LogOut, Menu, X } from "lucide-react";

import AtelierLogo from "./AtelierLogo";
import { Button } from "./button";
import { useAuth } from "@/context/AuthContext";
import { getSavedUsername } from "@/lib/api";
import { getInitials } from "@/lib/ui";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showProfileMenu && !showMobileMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showProfileMenu && !profileMenuRef.current?.contains(target)) {
        setShowProfileMenu(false);
      }
      if (showMobileMenu && !mobileMenuRef.current?.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu, showMobileMenu]);

  const navLinkClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-surface-hover text-text-primary"
        : "text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-hairline bg-surface-base/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <AtelierLogo size={28} />
            <span className="font-display text-base font-semibold tracking-tight text-text-primary">
              AtelierCode
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            <Link to="/" className={navLinkClass(isActive("/"))} aria-current={isActive("/") ? "page" : undefined}>
              Problems
            </Link>
            <Link
              to="/submissions"
              className={navLinkClass(isActive("/submissions"))}
              aria-current={isActive("/submissions") ? "page" : undefined}
            >
              Submissions
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden text-xs text-text-muted sm:inline">{username}</span>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu((prev) => !prev);
                setShowMobileMenu(false);
              }}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-wine-deep to-primary-container text-[11px] font-semibold text-white ring-offset-2 ring-offset-surface-base transition-shadow hover:ring-2 hover:ring-primary/60"
            >
              {getInitials(username)}
            </button>

            {showProfileMenu ? (
              <div
                role="menu"
                aria-label="Account"
                className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border-hairline bg-surface-elevated p-1.5 shadow-xl"
              >
                <div className="border-b border-border-hairline px-2.5 py-2">
                  <p className="truncate text-xs font-medium text-text-primary">{username}</p>
                  <p className="mt-0.5 text-[11px] text-text-muted">Signed in</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/"
                    role="menuitem"
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                  >
                    <Code2 className="h-3.5 w-3.5 text-primary" />
                    Problems
                  </Link>
                  <Link
                    to="/submissions"
                    role="menuitem"
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                  >
                    <ListOrdered className="h-3.5 w-3.5 text-status-accepted" />
                    Submissions
                  </Link>
                </div>

                <div className="border-t border-border-hairline pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-status-error transition-colors hover:bg-surface-hover"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              setShowMobileMenu((prev) => !prev);
              setShowProfileMenu(false);
            }}
            aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={showMobileMenu}
            aria-controls="mobile-navigation"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {showMobileMenu ? (
        <div
          id="mobile-navigation"
          ref={mobileMenuRef}
          className="border-t border-border-hairline bg-surface-elevated px-4 py-3 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                isActive("/") ? "bg-surface-hover text-text-primary" : "text-text-secondary"
              }`}
            >
              <Code2 className="h-4 w-4 text-primary" />
              Problems
            </Link>
            <Link
              to="/submissions"
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                isActive("/submissions")
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              <ListOrdered className="h-4 w-4 text-status-accepted" />
              Submissions
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-status-error transition-colors hover:bg-surface-hover"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
