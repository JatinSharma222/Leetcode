import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-border bg-secondary/50 text-foreground",
        circuit: "border border-primary/20 bg-primary/10 text-primary",
        orange: "border border-pending/25 bg-pending/10 text-pending",
        success: "border border-pass/30 bg-pass/10 text-pass",
        destructive: "border border-fail/30 bg-fail/10 text-fail",
        warning: "border border-pending/30 bg-pending/10 text-pending",
        outline: "border border-border text-foreground",
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
            "bg-primary": variant === "orange" || variant === "circuit",
            "bg-muted-foreground": !variant || variant === "default" || variant === "outline",
          })}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };