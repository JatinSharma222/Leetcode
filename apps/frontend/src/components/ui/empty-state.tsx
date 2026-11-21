import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-hairline bg-surface-elevated/60 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-hairline bg-surface-container text-text-muted">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold text-text-primary">{title}</p>
        <p className="max-w-md text-xs leading-5 text-text-muted">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
