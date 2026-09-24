import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Terminal, LogOut, CheckCircle2, User, Layers, Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { signOut, getSavedUsername } from "@/lib/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = getSavedUsername() || "Developer";

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    // On mount, check saved preference or system preference
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#74100B]/40 bg-[#5D0703] text-[#EEDCC8] shadow-[0_2px_8px_rgba(93,7,3,0.3)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEDCC8] text-[#5D0703] shadow-[0_1px_3px_rgba(40,2,1,0.25)]">
              <Terminal className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <span className="font-display text-xl font-bold tracking-wider text-[#EEDCC8]">
              ATELIER<span className="font-light italic text-[#DFB58E]">CODE</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs tracking-wide uppercase font-medium transition-all ${
                isActive("/")
                  ? "bg-[#74100B] text-[#EEDCC8] shadow-[inset_0_1px_0_0_rgba(238,220,200,0.2)] font-semibold"
                  : "text-[#EEDCC8]/70 hover:bg-[#6B0A06] hover:text-[#EEDCC8]"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[#DFB58E]" />
              Problems
            </Link>

            <Link
              to="/submissions"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs tracking-wide uppercase font-medium transition-all ${
                isActive("/submissions")
                  ? "bg-[#74100B] text-[#EEDCC8] shadow-[inset_0_1px_0_0_rgba(238,220,200,0.2)] font-semibold"
                  : "text-[#EEDCC8]/70 hover:bg-[#6B0A06] hover:text-[#EEDCC8]"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#DFB58E]" />
              Submissions
            </Link>
          </nav>
        </div>

        {/* Right: Theme toggle + User profile */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            title={isDark ? "Switch to cream vanilla background" : "Switch to deep burgundy background"}
            className="text-[#EEDCC8]/80 hover:text-[#EEDCC8] hover:bg-[#6B0A06]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2.5 border-l border-[#74100B] pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEDCC8]/15 border border-[#EEDCC8]/30 text-[#EEDCC8]">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden sm:inline font-sans text-xs font-medium tracking-wide text-[#EEDCC8] max-w-[120px] truncate">
              {username}
            </span>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Log out"
              className="text-[#EEDCC8]/70 hover:text-[#EEDCC8] hover:bg-[#74100B]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}