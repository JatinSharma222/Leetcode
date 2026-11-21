import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-mono font-medium",
  {
    variants: {
      variant: {
        neutral: "border-border-hairline bg-surface-container text-text-secondary",
        info: "border-primary/20 bg-primary/10 text-primary",
        success: "border-status-accepted/20 bg-status-accepted/10 text-status-accepted",
        warning: "border-status-warning/20 bg-status-warning/10 text-status-warning",
        danger: "border-status-error/20 bg-status-error/10 text-status-error",
        outline: "border-border-subtle bg-transparent text-text-secondary",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-1 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
