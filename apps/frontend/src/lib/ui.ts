import type { DifficultyLevel, SubmissionStatus } from "./types";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusMeta {
  label: string;
  shortLabel: string;
  tone: StatusTone;
}

const STATUS_META: Record<string, StatusMeta> = {
  Processing: { label: "Processing", shortLabel: "Processing", tone: "warning" },
  Success: { label: "Accepted", shortLabel: "Accepted", tone: "success" },
  Accepted: { label: "Accepted", shortLabel: "Accepted", tone: "success" },
  WrongAnswer: { label: "Wrong Answer", shortLabel: "Wrong Answer", tone: "danger" },
  Failure: { label: "Runtime Error", shortLabel: "Runtime Error", tone: "danger" },
  TLE: { label: "Time Limit Exceeded", shortLabel: "TLE", tone: "warning" },
  MLE: { label: "Memory Limit Exceeded", shortLabel: "MLE", tone: "warning" },
  CompileError: { label: "Compilation Error", shortLabel: "Compile Error", tone: "danger" },
  RuntimeError: { label: "Runtime Error", shortLabel: "Runtime Error", tone: "danger" },
};

export function getStatusMeta(status: SubmissionStatus | string): StatusMeta {
  return STATUS_META[status] ?? { label: status, shortLabel: status, tone: "neutral" };
}

export const DIFFICULTY_META: Record<
  DifficultyLevel,
  { label: DifficultyLevel; tone: StatusTone; dotClass: string; textClass: string }
> = {
  Easy: {
    label: "Easy",
    tone: "success",
    dotClass: "bg-status-accepted",
    textClass: "text-status-accepted",
  },
  Medium: {
    label: "Medium",
    tone: "warning",
    dotClass: "bg-status-warning",
    textClass: "text-status-warning",
  },
  Hard: {
    label: "Hard",
    tone: "danger",
    dotClass: "bg-status-error",
    textClass: "text-status-error",
  },
};

export function getDifficultyMeta(difficulty?: DifficultyLevel | null) {
  return DIFFICULTY_META[difficulty ?? "Easy"];
}

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python 3",
  cpp: "C++17",
  javascript: "JavaScript",
};

export function getLanguageLabel(language: string): string {
  return LANGUAGE_LABELS[language.toLowerCase()] ?? language;
}

export function formatRelativeTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 45) return "just now";
  if (absSeconds < 60 * 60) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 60 * 60 * 24) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (absSeconds < 60 * 60 * 24 * 30) return formatter.format(Math.round(diffSeconds / 86400), "day");
  if (absSeconds < 60 * 60 * 24 * 365) {
    return formatter.format(Math.round(diffSeconds / (86400 * 30)), "month");
  }
  return formatter.format(Math.round(diffSeconds / (86400 * 365)), "year");
}

export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatShortDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_>#~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "??";
  return trimmed.slice(0, 2).toUpperCase();
}

export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function getModifierKey(): string {
  if (typeof navigator === "undefined") return "Ctrl+";
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? "⌘" : "Ctrl+";
}
