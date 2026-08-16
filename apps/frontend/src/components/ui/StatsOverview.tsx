import React from "react";
import { CheckCircle2, Send, BarChart2 } from "lucide-react";
import { Card, CardContent } from "./card";

interface StatsOverviewProps {
  totalQuestions?: number;
  solvedCount?: number;
  totalSubmissions?: number;
  acceptanceRate?: number;
}

export default function StatsOverview({
  totalQuestions = 0,
  solvedCount = 0,
  totalSubmissions = 0,
  acceptanceRate = 0,
}: StatsOverviewProps) {
  const percentSolved = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-8">
      <Card className="border border-neutral-200/80 bg-white p-4 shadow-none dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-0 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-circuit/10 text-circuit">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Solved
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-semibold text-neutral-900 dark:text-white">
                {solvedCount}
              </span>
              <span className="font-mono text-xs text-neutral-400">/ {totalQuestions}</span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full bg-circuit rounded-full transition-all duration-500"
                style={{ width: `${percentSolved}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-neutral-200/80 bg-white p-4 shadow-none dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-0 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Submissions
            </p>
            <p className="font-display text-2xl font-semibold text-neutral-900 dark:text-white">{totalSubmissions}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-neutral-200/80 bg-white p-4 shadow-none dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-0 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-pass/10 text-pass">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Acceptance
            </p>
            <p className="font-display text-2xl font-semibold text-neutral-900 dark:text-white">{acceptanceRate}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}