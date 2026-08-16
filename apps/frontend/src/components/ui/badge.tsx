import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
        circuit: "border border-circuit/20 bg-circuit/10 text-circuit",
        orange: "border border-circuit/20 bg-circuit/10 text-circuit",
        success: "border border-pass/20 bg-pass/10 text-pass",
        destructive: "border border-fail/20 bg-fail/10 text-fail",
        warning: "border border-pending/20 bg-pending/10 text-pending",
        outline: "border border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300",
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
            "bg-pass": variant === "success",
            "bg-pending": variant === "warning",
            "bg-fail": variant === "destructive",
            "bg-circuit": variant === "orange" || variant === "circuit",
            "bg-neutral-400": !variant || variant === "default" || variant === "outline",
          })}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };