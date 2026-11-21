import { CheckCircle2, Flame, Send, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserStats } from "@/lib/types";

interface StatsOverviewProps {
  stats: UserStats | null;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  progress,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CheckCircle2;
  accent: string;
  progress?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${accent}`} />
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-display text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{detail}</p>
        {progress !== undefined ? (
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-status-accepted transition-all duration-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function StatsOverview({ stats, loading = false }: StatsOverviewProps) {
  if (loading || !stats) {
    return (
      <section aria-label="Your statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  const solvedPercent =
    stats.totalQuestions > 0 ? (stats.solvedCount / stats.totalQuestions) * 100 : 0;

  return (
    <section aria-label="Your statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Solved"
        value={`${stats.solvedCount} / ${stats.totalQuestions}`}
        detail={`${Math.round(solvedPercent)}% of the problem set`}
        icon={CheckCircle2}
        accent="text-status-accepted"
        progress={solvedPercent}
      />
      <StatCard
        label="Acceptance"
        value={`${stats.acceptanceRate}%`}
        detail={`${stats.acceptedSubmissions} accepted of ${stats.totalSubmissions} submissions`}
        icon={Target}
        accent="text-primary"
      />
      <StatCard
        label="Current streak"
        value={`${stats.currentStreak} ${stats.currentStreak === 1 ? "day" : "days"}`}
        detail={`Longest streak: ${stats.longestStreak} ${stats.longestStreak === 1 ? "day" : "days"}`}
        icon={Flame}
        accent="text-status-warning"
      />
      <StatCard
        label="Submissions"
        value={String(stats.totalSubmissions)}
        detail={`${stats.recentSubmissions} in the last 7 days`}
        icon={Send}
        accent="text-tertiary"
      />
    </section>
  );
}
