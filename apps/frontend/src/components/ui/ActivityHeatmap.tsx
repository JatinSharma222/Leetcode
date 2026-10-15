import React, { useMemo } from "react";
import type { Submission } from "@/lib/types";

interface ActivityHeatmapProps {
  submissions?: Submission[];
}

export default function ActivityHeatmap({ submissions = [] }: ActivityHeatmapProps) {
  const { weeks, totalRuns, activeStreak, activeDays, monthLabels } = useMemo(() => {
    const colorLevels = [
      "#1b1b1f", // Level 0: empty
      "#35151e", // Level 1: subtle wine
      "#68001a", // Level 2: medium wine
      "#9E1B32", // Level 3: deep brand wine
      "#e11d48", // Level 4: bright wine/crimson
    ];

    // Map date strings (YYYY-MM-DD) to count
    const dateCounts = new Map<string, number>();
    for (const sub of submissions) {
      if (!sub.createdAt) continue;
      const d = new Date(sub.createdAt);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
    }

    // Build 52 weeks ending today (Sunday through Saturday columns)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End on current week Saturday
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    const daysToSaturday = 6 - dayOfWeek;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysToSaturday);

    // Start 52 weeks before (52 * 7 = 364 days)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (52 * 7 - 1));

    const grid: { level: number; dateStr: string; count: number }[][] = [];
    const months: { label: string; colIdx: number }[] = [];
    let lastMonth = -1;

    const curr = new Date(startDate);
    for (let w = 0; w < 52; w++) {
      const col: { level: number; dateStr: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`;
        const count = dateCounts.get(key) || 0;

        let level = 0;
        if (count >= 7) level = 4;
        else if (count >= 4) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;

        if (d === 0 && curr.getMonth() !== lastMonth) {
          months.push({
            label: curr.toLocaleString("default", { month: "short" }),
            colIdx: w,
          });
          lastMonth = curr.getMonth();
        }

        col.push({ level, dateStr: key, count });
        curr.setDate(curr.getDate() + 1);
      }
      grid.push(col);
    }

    // Compute active streak leading up to today
    let streak = 0;
    const checkDate = new Date(today);
    const todayKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    const todayHasRuns = (dateCounts.get(todayKey) || 0) > 0;

    if (!todayHasRuns) {
      // Check if streak was active as of yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const k = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      if ((dateCounts.get(k) || 0) > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      weeks: { grid, colorLevels },
      totalRuns: submissions.length,
      activeStreak: streak,
      activeDays: dateCounts.size,
      monthLabels: months,
    };
  }, [submissions]);

  return (
    <section className="bg-surface-elevated rounded-xl p-6 shadow-xl flex flex-col gap-4 border border-white/5 mb-6">
      {/* Heatmap Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-text-primary">
            365-Day Activity Ledger
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Continuous evaluation record synced from your live judge submissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Submissions:</span>
            <span className="text-text-primary font-semibold">{totalRuns}</span>
          </div>
          <span className="text-text-muted">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Active Days:</span>
            <span className="text-primary font-semibold">{activeDays}</span>
          </div>
          <span className="text-text-muted">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Current Streak:</span>
            <span className="text-status-warning font-semibold">
              {activeStreak} {activeStreak === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Visual Matrix */}
      <div className="w-full overflow-x-auto pb-1">
        <div className="min-w-[840px] flex flex-col gap-1.5">
          {/* Month Labels */}
          <div className="relative h-4 text-text-muted font-mono text-[10px] uppercase tracking-wider pl-8">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${32 + m.colIdx * 15.2}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Matrix Rows with Day Labels */}
          <div className="flex gap-2">
            <div className="flex flex-col justify-between text-text-muted font-mono text-[10px] py-0.5 pr-1 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="flex-1 w-full">
              <svg className="w-full h-26" fill="none" viewBox="0 0 832 110" xmlns="http://www.w3.org/2000/svg">
                {weeks.grid.map((col, colIdx) => (
                  <g key={colIdx}>
                    {col.map((cell, rowIdx) => (
                      <rect
                        key={rowIdx}
                        x={colIdx * 16}
                        y={rowIdx * 15}
                        width="11.5"
                        height="11.5"
                        rx="2"
                        fill={weeks.colorLevels[cell.level]}
                        className="transition-colors hover:stroke-white/60 hover:stroke-[1.5]"
                      >
                        <title>{`${cell.count} ${cell.count === 1 ? "submission" : "submissions"} on ${cell.dateStr}`}</title>
                      </rect>
                    ))}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Legend & Empty State Helper */}
          <div className="flex items-center justify-between text-[10px] text-text-muted font-mono pt-1">
            <span>
              {totalRuns === 0
                ? "No submissions logged yet. Solve a problem to begin your activity record!"
                : `${totalRuns} total evaluations recorded across 52 weeks`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {weeks.colorLevels.map((c, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ backgroundColor: c }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
