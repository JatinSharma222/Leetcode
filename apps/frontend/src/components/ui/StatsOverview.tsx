import React, { useMemo } from "react";
import { Link } from "react-router";
import { Check, ArrowRight, CheckCircle2, Flame, Award } from "lucide-react";
import type { Question, Submission } from "@/lib/types";

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
  isDailySolved?: boolean;
  submissions?: Submission[];
}

export default function StatsOverview({
  totalQuestions = 0,
  solvedCount = 0,
  totalSubmissions = 0,
  acceptanceRate = 0,
  easySolved = 0,
  easyTotal = 0,
  mediumSolved = 0,
  mediumTotal = 0,
  hardSolved = 0,
  hardTotal = 0,
  dailyQuestion,
  isDailySolved = false,
  submissions = [],
}: StatsOverviewProps) {
  const percentSolved = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  // Compute 7-day momentum from submissions
  const { streak, past7Days } = useMemo(() => {
    const dateCounts = new Map<string, number>();
    for (const sub of submissions) {
      if (!sub.createdAt) continue;
      const d = new Date(sub.createdAt);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate active streak
    let activeStreak = 0;
    const checkDate = new Date(today);
    const todayKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    const todayHasRuns = (dateCounts.get(todayKey) || 0) > 0;

    if (!todayHasRuns) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const k = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      if ((dateCounts.get(k) || 0) > 0) {
        activeStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Past 7 days (including today)
    const days: { label: string; active: boolean; isToday: boolean }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        label: dayNames[d.getDay()] ?? "",
        active: (dateCounts.get(k) || 0) > 0,
        isToday: i === 0,
      });
    }

    return { streak: activeStreak, past7Days: days };
  }, [submissions]);

  const dailyId = dailyQuestion?.id || "";
  const dailyTitle = dailyQuestion?.title || "Challenge of the Day";
  const dailyDesc = dailyQuestion?.description
    ? dailyQuestion.description.slice(0, 160) + (dailyQuestion.description.length > 160 ? "..." : "")
    : "Select a challenge from the problem catalog to begin solving.";

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch mb-6">
      {/* Card 1: Featured Daily Challenge (6 cols / 50%) */}
      <div className="lg:col-span-6 bg-surface-elevated rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl border border-white/5">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-brand-wine-deep/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/15 text-primary font-mono text-xs font-semibold tracking-wide border border-primary-container/20">
                <span>⚡</span> Featured Problem
              </span>
              {isDailySolved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-accepted/10 text-status-accepted font-mono text-[11px] font-medium border border-status-accepted/20">
                  <CheckCircle2 className="h-3 w-3" /> Solved
                </span>
              )}
            </div>

            <span className="font-mono text-xs text-text-muted">
              {dailyQuestion?._count?.testCases ?? 0} Test Cases
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">
              {dailyTitle}
            </h2>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed max-w-2xl mb-4 font-sans line-clamp-2">
            {dailyDesc}
          </p>
        </div>

        {/* Action Ribbon */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 bg-surface-container-low/40 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Library Challenge</span>
            <span>•</span>
            <span className="text-text-secondary">Sandboxed Runner</span>
          </div>

          {dailyId ? (
            <Link
              to={`/problem/${dailyId}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container hover:bg-brand-wine-deep text-on-primary-container text-xs font-semibold tracking-wide transition-all duration-150 shadow-[0_0_20px_-3px_rgba(225,29,72,0.45)] hover:shadow-[0_0_28px_0px_rgba(225,29,72,0.6)] active:scale-[0.98]"
            >
              <span>{isDailySolved ? "Review Solution" : "Solve Challenge"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="text-xs text-text-muted">Explore catalogue below</span>
          )}
        </div>
      </div>

      {/* Card 2: Personal Momentum & Streak (3 cols / 25%) */}
      <div className="lg:col-span-3 bg-surface-elevated rounded-xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden border border-white/5">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-status-warning" />
              <h3 className="font-display text-sm font-bold text-text-primary">Consistency</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-semibold">
              {streak} {streak === 1 ? "Day" : "Days"}
            </span>
          </div>

          {/* 7-Day Matrix */}
          <div className="grid grid-cols-7 gap-1.5 mb-5 text-center">
            {past7Days.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className={`font-mono text-[10px] ${day.isToday ? "text-primary font-bold" : "text-text-muted"}`}>
                  {day.label[0]}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs transition-colors ${
                    day.active
                      ? "bg-status-warning/20 text-status-warning font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                      : "bg-surface-container text-text-muted/40"
                  }`}
                  title={`${day.label}: ${day.active ? "Activity recorded" : "No submissions"}`}
                >
                  {day.active ? <Check className="h-3.5 w-3.5" /> : "•"}
                </div>
              </div>
            ))}
          </div>

          {/* Real Metrics Summary */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low mb-3 border border-white/5 text-xs">
            <span className="text-text-secondary">Total Runs</span>
            <span className="font-mono font-semibold text-text-primary">{totalSubmissions}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-text-muted">Solved Ratio</span>
            <span className="font-mono text-text-primary font-semibold">
              {solvedCount} / {totalQuestions}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-status-warning to-primary-container rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentSolved, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Solved Portfolio (3 cols / 25%) */}
      <div className="lg:col-span-3 bg-surface-elevated rounded-xl p-5 flex flex-col justify-between shadow-xl border border-white/5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-bold text-text-primary">Solved Portfolio</h3>
            <Award className="h-4 w-4 text-tertiary" />
          </div>

          {/* Radial Progress & High-Level Stat */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-16 shrink-0">
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
                <span className="font-mono text-sm font-bold text-text-primary leading-none">
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
              <span className="text-xs text-text-muted font-sans">Solved Completion</span>
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
          <span className="text-text-muted font-sans">User Acceptance Rate</span>
          <span className="font-mono font-bold text-status-accepted">{acceptanceRate}%</span>
        </div>
      </div>
    </section>
  );
}