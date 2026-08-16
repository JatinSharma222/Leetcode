import React from "react";
import { cn } from "@/lib/utils";

interface TestStripProps {
  total: number;
  passed: number;
  allFailed?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function TestStrip({ total, passed, allFailed = false, size = "md", className }: TestStripProps) {
  if (total <= 0) return null;

  const ticks = Array.from({ length: total }, (_, i) => {
    if (allFailed) return "fail" as const;
    return i < passed ? ("pass" as const) : ("neutral" as const);
  });

  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("flex items-center gap-[3px]", className)} role="img" aria-label={`${passed} of ${total} test cases passed`}>
      {ticks.map((state, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 min-w-[3px] rounded-[1.5px] transition-colors duration-300",
            height,
            state === "pass" && "bg-pass",
            state === "fail" && "bg-fail",
            state === "neutral" && "bg-neutral-300 dark:bg-neutral-700",
          )}
        />
      ))}
    </div>
  );
}