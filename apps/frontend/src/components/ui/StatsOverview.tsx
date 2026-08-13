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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
      <Card className="border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-0 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Problems Solved</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">{solvedCount}</span>
              <span className="text-xs text-neutral-400">/ {totalQuestions}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${percentSolved}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-0 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Submissions</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalSubmissions}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-0 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Acceptance Rate</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{acceptanceRate}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}