import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityHeatmapProps {
  activity: Record<string, number>;
  totalSubmissions?: number;
  activeDays?: number;
  currentStreak?: number;
}

const COLOR_LEVELS = ["#1b1b1f", "#35151e", "#68001a", "#9e1b32", "#e11d48"];

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function ActivityHeatmap({
  activity,
  totalSubmissions = 0,
  activeDays = 0,
  currentStreak = 0,
}: ActivityHeatmapProps) {
  const { grid, months } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    endDate.setUTCDate(endDate.getUTCDate() + (6 - endDate.getUTCDay()));

    const startDate = new Date(endDate);
    startDate.setUTCDate(endDate.getUTCDate() - (52 * 7 - 1));

    const weeks: { level: number; date: string; count: number }[][] = [];
    const monthLabels: { label: string; column: number }[] = [];
    let lastMonth = -1;
    const cursor = new Date(startDate);

    for (let week = 0; week < 52; week += 1) {
      const column: { level: number; date: string; count: number }[] = [];

      for (let day = 0; day < 7; day += 1) {
        const key = toDateKey(cursor);
        const count = activity[key] ?? 0;
        let level = 0;
        if (count >= 7) level = 4;
        else if (count >= 4) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;

        if (day === 0 && cursor.getUTCMonth() !== lastMonth) {
          monthLabels.push({
            label: cursor.toLocaleString("en", { month: "short", timeZone: "UTC" }),
            column: week,
          });
          lastMonth = cursor.getUTCMonth();
        }

        column.push({ level, date: key, count });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      weeks.push(column);
    }

    return { grid: weeks, months: monthLabels };
  }, [activity]);

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Activity</CardTitle>
          <p className="text-xs text-text-muted">Submissions over the last 12 months</p>
        </div>

        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-text-muted">Submissions</dt>
            <dd className="font-mono font-semibold text-text-primary">{totalSubmissions}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-text-muted">Active days</dt>
            <dd className="font-mono font-semibold text-text-primary">{activeDays}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-text-muted">Streak</dt>
            <dd className="font-mono font-semibold text-status-warning">
              {currentStreak} {currentStreak === 1 ? "day" : "days"}
            </dd>
          </div>
        </dl>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[760px]">
            <svg
              viewBox="0 0 832 126"
              className="h-auto w-full text-text-muted"
              role="img"
              aria-label={`Activity heatmap with ${totalSubmissions} submissions across ${activeDays} active days`}
            >
              {months.map((month) => (
                <text
                  key={`${month.label}-${month.column}`}
                  x={month.column * 16}
                  y={10}
                  fill="currentColor"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {month.label}
                </text>
              ))}

              {grid.map((week, weekIndex) => (
                <g key={weekIndex}>
                  {week.map((cell, dayIndex) => (
                    <rect
                      key={cell.date}
                      x={weekIndex * 16}
                      y={20 + dayIndex * 15}
                      width="11.5"
                      height="11.5"
                      rx="2"
                      fill={COLOR_LEVELS[cell.level]}
                      className="transition-colors hover:stroke-white/50 hover:stroke-[1.5]"
                    >
                      <title>
                        {cell.count} {cell.count === 1 ? "submission" : "submissions"} on {cell.date}
                      </title>
                    </rect>
                  ))}
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-text-muted">
          <span>
            {totalSubmissions === 0
              ? "No submissions yet. Solve a problem to start your activity history."
              : `${totalSubmissions} total ${totalSubmissions === 1 ? "submission" : "submissions"} recorded`}
          </span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            {COLOR_LEVELS.map((color) => (
              <span
                key={color}
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
