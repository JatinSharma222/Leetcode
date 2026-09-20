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
      <Card className="border border-border bg-[#18181c] p-5 shadow-sm">
        <CardContent className="p-0 flex items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            {/* Circular progress background */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-800"
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
              <span className="font-display text-lg font-bold text-white leading-none">
                {solvedCount}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                /{totalQuestions}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Problems Solved</span>
              <span className="font-mono text-neutral-400 text-[11px]">{percentSolved}%</span>
            </div>

            {/* Easy Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#00b8a3] font-semibold">Easy</span>
                <span className="text-neutral-400">{easySolved}/{easyTotal}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-[#00b8a3] rounded-full transition-all duration-500"
                  style={{ width: `${easyTotal > 0 ? (easySolved / easyTotal) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#ffc01e] font-semibold">Medium</span>
                <span className="text-neutral-400">{mediumSolved}/{mediumTotal}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-[#ffc01e] rounded-full transition-all duration-500"
                  style={{ width: `${mediumTotal > 0 ? (mediumSolved / mediumTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Stats Card */}
      <Card className="border border-border bg-[#18181c] p-5 shadow-sm">
        <CardContent className="p-0 flex items-center gap-4 h-full">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              Total Submissions
            </p>
            <p className="font-display text-3xl font-bold text-white mt-0.5">
              {totalSubmissions}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Evaluated across all test runs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Acceptance Rate Card */}
      <Card className="border border-border bg-[#18181c] p-5 shadow-sm">
        <CardContent className="p-0 flex items-center gap-4 h-full">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pass/10 text-pass">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              Acceptance Rate
            </p>
            <p className="font-display text-3xl font-bold text-white mt-0.5">
              {acceptanceRate}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Accepted solutions ratio
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}