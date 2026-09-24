import React from "react";
import { CheckCircle2, Send, BarChart2, Flame } from "lucide-react";
import { Card, CardContent } from "./card";

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
}

export default function StatsOverview({
  totalQuestions = 0,
  solvedCount = 0,
  totalSubmissions = 0,
  acceptanceRate = 0,
  easySolved = 0,
  easyTotal = 7,
  mediumSolved = 0,
  mediumTotal = 3,
  hardSolved = 0,
  hardTotal = 0,
}: StatsOverviewProps) {
  const percentSolved = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
      {/* Solved Progress Card */}
      <Card className="border border-border bg-card p-5 shadow-[0_2px_8px_rgba(93,7,3,0.06)]">
        <CardContent className="p-0 flex items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            {/* Circular progress background */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-secondary/80"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary transition-all duration-700"
                strokeDasharray={`${percentSolved}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-xl font-bold text-foreground leading-none">
                {solvedCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                /{totalQuestions}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Challenges Solved</span>
              <span className="font-mono text-muted-foreground text-[11px]">{percentSolved}%</span>
            </div>

            {/* Easy Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-easy font-semibold">Easy</span>
                <span className="text-muted-foreground">{easySolved}/{easyTotal}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-easy rounded-full transition-all duration-500"
                  style={{ width: `${easyTotal > 0 ? (easySolved / easyTotal) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-medium font-semibold">Medium</span>
                <span className="text-muted-foreground">{mediumSolved}/{mediumTotal}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-medium rounded-full transition-all duration-500"
                  style={{ width: `${mediumTotal > 0 ? (mediumSolved / mediumTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Stats Card */}
      <Card className="border border-border bg-card p-5 shadow-[0_2px_8px_rgba(93,7,3,0.06)]">
        <CardContent className="p-0 flex items-center gap-4 h-full">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Total Submissions
            </p>
            <p className="font-display text-3xl font-bold text-foreground mt-0.5">
              {totalSubmissions}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Evaluated across curated tests
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Acceptance Rate Card */}
      <Card className="border border-border bg-card p-5 shadow-[0_2px_8px_rgba(93,7,3,0.06)]">
        <CardContent className="p-0 flex items-center gap-4 h-full">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pass/15 text-pass border border-pass/30 shadow-xs">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Acceptance Ratio
            </p>
            <p className="font-display text-3xl font-bold text-foreground mt-0.5">
              {acceptanceRate}%
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Verified accepted solutions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}