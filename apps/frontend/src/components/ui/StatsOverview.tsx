import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { Check, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Question } from "@/lib/types";

interface StatsOverviewProps {
  totalQuestions?: number;
  solvedCount?: number;
  totalSubmissions?: number;
  acceptanceRate?: number;
  easySolved?: number;
  easyTotal?: number;
  mediumSolved?: number;
  mediumTotal?: number;
  hardSolved?: number;
  hardTotal?: number;
  dailyQuestion?: Question | null;
}

export default function StatsOverview({
  totalQuestions = 0,
  solvedCount = 0,
  acceptanceRate = 78.2,
  easySolved = 0,
  easyTotal = 5,
  mediumSolved = 0,
  mediumTotal = 3,
  hardSolved = 0,
  hardTotal = 2,
  dailyQuestion,
}: StatsOverviewProps) {
  // Live countdown timer for the daily challenge (e.g., remaining until midnight UTC)
  const [timeLeft, setTimeLeft] = useState("06h 20m 13s remaining");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s remaining`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const percentSolved = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;
  const easyPercent = easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0;
  const medPercent = mediumTotal > 0 ? Math.round((mediumSolved / mediumTotal) * 100) : 0;
  const hardPercent = hardTotal > 0 ? Math.round((hardSolved / hardTotal) * 100) : 0;

  const dailyId = dailyQuestion?.id || "two-sum";
  const dailyTitle = dailyQuestion?.title || "Two Sum (Pair Matching)";
  const dailyDesc = dailyQuestion?.description
    ? dailyQuestion.description.slice(0, 140) + "..."
    : "Find indices of the two numbers such that they add up to a specific target.";

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch mb-6">
      {/* Card 1: 3D Daily Quest Monolith (6 cols / 50%) */}
      <div className="lg:col-span-6 bg-surface-elevated rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl border border-white/5">
        {/* Ambient radial glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-brand-wine-deep/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Meta & Quest Countdown Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-warning/15 text-status-warning font-mono text-xs font-semibold tracking-wide">
                <span>🔥</span> Daily Quest • 2X XP
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-mono text-[11px] font-medium">
                Medium
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-base text-text-secondary font-mono text-xs border border-white/5">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
              <span className="text-text-primary font-medium">{timeLeft}</span>
            </div>
          </div>

          {/* Problem Title & Specs */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="font-mono text-base text-text-muted font-semibold select-none">#1</span>
            <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">
              {dailyTitle}
            </h2>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-surface-container text-text-secondary border border-white/5">
              Array
            </span>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-surface-container text-text-secondary border border-white/5">
              Hash Table
            </span>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-surface-container text-text-secondary border border-white/5">
              Two Pointers
            </span>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed max-w-2xl mb-4 font-sans line-clamp-2">
            {dailyDesc}
          </p>
        </div>

        {/* Action Ribbon */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 bg-surface-container-low/40 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-status-accepted" />
              <span className="font-mono text-xs text-text-secondary">
                Acc: <span className="text-text-primary font-semibold">49.8%</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-status-warning text-xs">⚡</span>
              <span className="font-mono text-xs text-text-secondary">
                Reward: <span className="text-status-warning font-semibold">+150 XP</span>
              </span>
            </div>
          </div>

          <Link
            to={`/problem/${dailyId}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container hover:bg-brand-wine-deep text-on-primary-container text-xs font-semibold tracking-wide transition-all duration-150 shadow-[0_0_20px_-3px_rgba(225,29,72,0.45)] hover:shadow-[0_0_28px_0px_rgba(225,29,72,0.6)] active:scale-[0.98]"
          >
            <span>Solve Daily Challenge</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Card 2: Consistency Streak Tracker (3 cols / 25%) */}
      <div className="lg:col-span-3 bg-surface-elevated rounded-xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden border border-white/5">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-base text-status-warning">🔥</span>
              <h3 className="font-display text-sm font-bold text-text-primary">Consistency Streak</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-semibold">
              14 Days
            </span>
          </div>

          {/* 7-Day Matrix */}
          <div className="grid grid-cols-7 gap-1.5 mb-5 text-center">
            {["M", "T", "W", "T", "F"].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-text-muted">{day}</span>
                <div className="w-7 h-7 rounded-full bg-status-warning/20 text-status-warning flex items-center justify-center font-mono text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
            {/* Saturday (Today) */}
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-text-primary font-bold">S</span>
              <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-mono text-xs font-bold animate-pulse shadow-[0_0_14px_rgba(225,29,72,0.6)]">
                ⚡
              </div>
            </div>
            {/* Sunday */}
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-text-muted">S</span>
              <div className="w-7 h-7 rounded-full bg-surface-container text-text-muted flex items-center justify-center font-mono text-xs">
                •
              </div>
            </div>
          </div>

          {/* Streak Safeguard Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low mb-4 border border-white/5">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-text-secondary" />
              <span className="text-xs text-text-primary font-medium">1 Freeze Shield Active</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-tertiary">
              READY
            </span>
          </div>
        </div>

        {/* Milestone Progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="text-text-secondary font-sans">21-Day Titan League</span>
            <span className="font-mono text-text-primary font-semibold">14 / 21 Days</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-status-warning to-primary-container rounded-full"
              style={{ width: "66.6%" }}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Solved Portfolio (3 cols / 25%) */}
      <div className="lg:col-span-3 bg-surface-elevated rounded-xl p-5 flex flex-col justify-between shadow-xl border border-white/5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-bold text-text-primary">Solved Portfolio</h3>
            <span className="text-sm">🎯</span>
          </div>

          {/* Radial Progress & High-Level Stat */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-18 h-18 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-highest"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-status-accepted transition-all duration-500"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${percentSolved}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-base font-bold text-text-primary leading-none">
                  {solvedCount}
                </span>
                <span className="font-mono text-[9px] text-text-muted mt-0.5">
                  /{totalQuestions}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-tight text-text-primary">
                {percentSolved}%
              </span>
              <span className="text-xs text-text-muted font-sans">Mastery Completion</span>
            </div>
          </div>

          {/* Difficulty Distribution Tiers */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-surface-container-low border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-accepted" />
                <span className="text-xs text-text-secondary">Easy</span>
              </div>
              <span className="font-mono text-xs text-text-primary font-semibold">
                {easySolved} <span className="text-text-muted font-normal">/ {easyTotal}</span>
              </span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-surface-container-low border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-warning" />
                <span className="text-xs text-text-secondary">Medium</span>
              </div>
              <span className="font-mono text-xs text-text-primary font-semibold">
                {mediumSolved} <span className="text-text-muted font-normal">/ {mediumTotal}</span>
              </span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-surface-container-low border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-error" />
                <span className="text-xs text-text-secondary">Hard</span>
              </div>
              <span className="font-mono text-xs text-text-primary font-semibold">
                {hardSolved} <span className="text-text-muted font-normal">/ {hardTotal}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between text-xs border-t border-white/5 mt-2">
          <span className="text-text-muted font-sans">Global Acceptance</span>
          <span className="font-mono font-bold text-status-accepted">{acceptanceRate}%</span>
        </div>
      </div>
    </section>
  );
}