import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous && value - previous > 1) {
      result.push("ellipsis");
    }
    result.push(value);
  });

  return result;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <p className="font-mono text-[11px] text-text-muted">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>

        {getPageNumbers(page, totalPages).map((value, index) =>
          value === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1 font-mono text-xs text-text-muted">
              …
            </span>
          ) : (
            <Button
              key={value}
              variant={value === page ? "primary" : "ghost"}
              size="icon"
              onClick={() => onPageChange(value)}
              aria-current={value === page ? "page" : undefined}
              aria-label={`Page ${value}`}
              className="font-mono text-[11px]"
            >
              {value}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
