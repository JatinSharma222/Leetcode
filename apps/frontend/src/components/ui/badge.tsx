import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
        easy:
          "border border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400",
        medium:
          "border border-amber-500/20 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400",
        hard:
          "border border-rose-500/20 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400",
        orange:
          "border border-orange-500/20 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-400",
        success:
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        destructive:
          "border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        warning:
          "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        outline:
          "border border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = true, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
            "bg-emerald-500": variant === "easy" || variant === "success",
            "bg-amber-500": variant === "medium" || variant === "warning",
            "bg-rose-500": variant === "hard" || variant === "destructive",
            "bg-orange-500": variant === "orange",
            "bg-neutral-400": !variant || variant === "default" || variant === "outline",
          })}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
