import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileCode2,
  History,
  Search,
  Send,
  Target,
  Terminal,
  X,
} from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { toast } from "sonner";

import Navbar from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  fetchSubmissionById,
  fetchSubmissionStats,
  fetchUserSubmissions,
} from "@/lib/api";
import { setForkPayload } from "@/lib/drafts";
import { defineObsidianTheme, OBSIDIAN_THEME } from "@/lib/monaco";
import type {
  PaginationMetadata,
  Submission,
  SubmissionDetail,
  UserStats,
} from "@/lib/types";
import {
  formatDateTime,
  formatRelativeTime,
  getStatusMeta,
} from "@/lib/ui";
import { usePageTitle } from "@/lib/usePageTitle";

const PAGE_SIZE = 20;

const VERDICT_OPTIONS = [
  { value: "All", label: "All verdicts" },
  { value: "Accepted", label: "Accepted" },
  { value: "WrongAnswer", label: "Wrong Answer" },
  { value: "RuntimeError", label: "Runtime Error" },
  { value: "TLE", label: "Time Limit Exceeded" },
  { value: "CompileError", label: "Compile Error" },
];

const LANGUAGE_OPTIONS = [
  { value: "All", label: "All languages" },
  { value: "python", label: "Python 3" },
  { value: "cpp", label: "C++ 17" },
  { value: "javascript", label: "JavaScript" },
];

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  python: "py",
  cpp: "cpp",
  javascript: "js",
};

const EMPTY_PAGINATION: PaginationMetadata = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Send;
  accent: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${accent}`} />
      </CardHeader>
      <CardContent className="space-y-1.5">
        <p className="font-display text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function Submissions() {
  usePageTitle("Submissions");

  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>(EMPTY_PAGINATION);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");

  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, languageFilter]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await fetchSubmissionStats();
      setStats(data);
    } catch {
      // The table can still work if aggregate stats fail.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserSubmissions({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
        language: languageFilter,
        search: debouncedSearch || undefined,
      });

      if (result.pagination.totalPages > 0 && page > result.pagination.totalPages) {
        setPage(result.pagination.totalPages);
        return;
      }

      setSubmissions(result.submissions);
      setPagination(result.pagination);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/auth");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, languageFilter, debouncedSearch, navigate]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (submissions.length === 0) {
      setSelectedSub(null);
      return;
    }
    if (!selectedSub || !submissions.some((submission) => submission.id === selectedSub.id)) {
      setSelectedSub(submissions[0] ?? null);
    }
  }, [submissions, selectedSub]);

  useEffect(() => {
    if (!selectedSub) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setDetailLoading(true);
    fetchSubmissionById(selectedSub.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSub]);

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== "All" || languageFilter !== "All";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setLanguageFilter("All");
    setPage(1);
  };

  const copyText = async (text: string, target: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    setTimeout(() => setCopiedTarget(null), 1500);
    toast.success("Copied to clipboard");
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const rows: Submission[] = [];
      let exportPage = 1;
      let totalPages = 1;

      do {
        const result = await fetchUserSubmissions({
          page: exportPage,
          limit: 100,
          status: statusFilter,
          language: languageFilter,
          search: debouncedSearch || undefined,
        });
        rows.push(...result.submissions);
        totalPages = result.pagination.totalPages;
        exportPage += 1;
      } while (exportPage <= totalPages && exportPage <= 100);

      if (rows.length === 0) {
        toast("No submissions to export");
        return;
      }

      const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const header = [
        "id",
        "problem",
        "status",
        "language",
        "passed",
        "total",
        "created_at",
      ].join(",");
      const body = rows
        .map((submission) =>
          [
            escape(submission.id),
            escape(submission.question?.title ?? submission.questionId),
            escape(submission.status),
            escape(submission.language),
            submission.passedCount,
            submission.totalCount,
            escape(submission.createdAt),
          ].join(","),
        )
        .join("\n");

      const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ateliercode-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} submissions`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const openInEditor = (submission: Submission) => {
    setForkPayload({
      questionId: submission.questionId,
      language: submission.language,
      code: submission.code,
    });
    navigate(`/problem/${submission.questionId}`);
  };

  const acceptanceRate = stats?.acceptanceRate ?? 0;
  const selected = detail && selectedSub && detail.id === selectedSub.id ? detail : selectedSub;
  const caseResults = detail?.results ?? [];
  const selectedMeta = selected ? getStatusMeta(selected.status) : null;

  const languageSummary = useMemo(() => {
    if (!stats) return "—";
    const entries = Object.entries(stats.languageCounts);
    if (entries.length === 0) return "—";
    const [language, count] = entries.sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    const label = LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language;
    return `${label} (${count})`;
  }, [stats]);

  return (
    <div className="min-h-screen bg-surface-base font-sans text-text-primary">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              History
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Submissions</h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              Review verdicts, inspect submitted code, and reopen a solution in the editor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleExportCSV} disabled={exporting}>
              <Download />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button variant="primary" asChild>
              <Link to="/">
                <Terminal />
                Practice
              </Link>
            </Button>
          </div>
        </header>

        {error ? (
          <Card className="mb-6 border-status-error/30 bg-status-error/5">
            <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Could not load submissions</p>
                  <p className="mt-0.5 text-xs text-text-muted">{error}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={loadSubmissions}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <section aria-label="Submission statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsLoading || !stats ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                label="Total submissions"
                value={String(stats.totalSubmissions)}
                detail={`${stats.recentSubmissions} in the last 7 days`}
                icon={Send}
                accent="text-tertiary"
              />
              <StatCard
                label="Accepted"
                value={String(stats.acceptedSubmissions)}
                detail={`${acceptanceRate}% acceptance rate`}
                icon={CheckCircle2}
                accent="text-status-accepted"
              />
              <StatCard
                label="Problems solved"
                value={`${stats.solvedCount} / ${stats.totalQuestions}`}
                detail={`${stats.attemptedCount} problems attempted`}
                icon={Target}
                accent="text-primary"
              />
              <StatCard
                label="Active days"
                value={String(stats.activeDays)}
                detail={`Longest streak: ${stats.longestStreak} ${stats.longestStreak === 1 ? "day" : "days"}`}
                icon={Clock}
                accent="text-status-warning"
              />
            </>
          )}
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="overflow-hidden lg:col-span-8">
            <CardHeader className="gap-3 border-b border-border-hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Submission history</CardTitle>
                  <p className="mt-1 text-xs text-text-muted">
                    {loading
                      ? "Loading submissions…"
                      : `${pagination.total} ${pagination.total === 1 ? "submission" : "submissions"} found`}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <X />
                    Clear filters
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by problem title"
                    aria-label="Search submissions"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by verdict"
                  className="sm:w-44"
                >
                  {VERDICT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={languageFilter}
                  onChange={(event) => setLanguageFilter(event.target.value)}
                  aria-label="Filter by language"
                  className="sm:w-36"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border-hairline bg-surface-container-low/40 text-[11px] uppercase tracking-wide text-text-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Verdict</th>
                    <th scope="col" className="px-4 py-3 font-medium">Problem</th>
                    <th scope="col" className="px-4 py-3 font-medium">Passed</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Language</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Submitted</th>
                    <th scope="col" className="w-10 px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-hairline">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="hidden px-4 py-4 sm:table-cell"><Skeleton className="h-5 w-16" /></td>
                        <td className="hidden px-4 py-4 md:table-cell"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-4"><Skeleton className="h-4 w-4" /></td>
                      </tr>
                    ))
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <EmptyState
                          icon={History}
                          title={hasActiveFilters ? "No matching submissions" : "No submissions yet"}
                          description={
                            hasActiveFilters
                              ? "Try a different search term or clear the active filters."
                              : "Solve a problem and submit your code to start building your history."
                          }
                          className="rounded-none border-0 bg-transparent"
                          action={
                            hasActiveFilters ? (
                              <Button variant="secondary" size="sm" onClick={resetFilters}>
                                Clear filters
                              </Button>
                            ) : (
                              <Button variant="primary" size="sm" asChild>
                                <Link to="/">
                                  Browse problems
                                  <ArrowRight />
                                </Link>
                              </Button>
                            )
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    submissions.map((submission) => {
                      const meta = getStatusMeta(submission.status);
                      const isSelected = selectedSub?.id === submission.id;
                      const passPercent = Math.round(
                        (submission.passedCount / Math.max(submission.totalCount, 1)) * 100,
                      );

                      return (
                        <tr
                          key={submission.id}
                          tabIndex={0}
                          aria-selected={isSelected}
                          onClick={() => setSelectedSub(submission)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedSub(submission);
                            }
                          }}
                          className={`cursor-pointer transition-colors hover:bg-surface-hover/50 ${
                            isSelected ? "bg-surface-hover/70" : ""
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge variant={meta.tone}>{meta.label}</Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col">
                              <span className="max-w-[240px] truncate text-xs font-medium text-text-primary">
                                {submission.question?.title ?? submission.questionId}
                              </span>
                              <span className="font-mono text-[10px] text-text-muted">
                                {submission.question?.difficulty ?? ""}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-text-primary">
                                {submission.passedCount}/{submission.totalCount}
                              </span>
                              <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-surface-container sm:block">
                                <div
                                  className={`h-full rounded-full ${
                                    passPercent === 100 ? "bg-status-accepted" : "bg-status-warning"
                                  }`}
                                  style={{ width: `${passPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="hidden whitespace-nowrap px-4 py-3.5 sm:table-cell">
                            <span className="font-mono text-[11px] uppercase text-text-secondary">
                              {submission.language}
                            </span>
                          </td>
                          <td
                            className="hidden whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-text-muted md:table-cell"
                            title={formatDateTime(submission.createdAt)}
                          >
                            {formatRelativeTime(submission.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <ChevronRight className="ml-auto h-3.5 w-3.5 text-text-muted" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 ? (
              <div className="border-t border-border-hairline p-4">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </Card>

          <div className="lg:col-span-4">
            <Card className="lg:sticky lg:top-20">
              {selected && selectedMeta ? (
                <>
                  <CardHeader className="gap-2 border-b border-border-hairline">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={selectedMeta.tone}>{selectedMeta.label}</Badge>
                      <span className="font-mono text-[10px] text-text-muted">
                        {selected.id.slice(0, 8)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-sm">
                        {selected.question?.title ?? selected.questionId}
                      </CardTitle>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {formatRelativeTime(selected.createdAt)} · {selected.language}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border border-border-hairline bg-surface-base p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-text-muted">
                          Test cases
                        </p>
                        <p className="mt-1 font-mono text-sm font-semibold text-text-primary">
                          {selected.passedCount} / {selected.totalCount}
                        </p>
                      </div>
                      <div className="rounded-md border border-border-hairline bg-surface-base p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-text-muted">
                          Language
                        </p>
                        <p className="mt-1 font-mono text-sm font-semibold text-text-primary">
                          {LANGUAGE_OPTIONS.find((option) => option.value === selected.language)?.label ??
                            selected.language}
                        </p>
                      </div>
                    </div>

                    {detailLoading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : caseResults.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-text-muted">
                          <span>Per-test results</span>
                          <span>
                            {caseResults.filter((result) => result.passed).length} passed
                          </span>
                        </div>
                        <div
                          className="grid gap-1"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(caseResults.length, 30)}, minmax(0, 1fr))`,
                          }}
                        >
                          {caseResults.map((result, index) => (
                            <div
                              key={result.id}
                              className={`h-2 rounded-[2px] ${
                                result.passed
                                  ? "bg-status-accepted"
                                  : result.timedOut
                                    ? "bg-status-warning"
                                    : "bg-status-error"
                              }`}
                              title={`Test case ${index + 1}: ${
                                result.passed
                                  ? "Passed"
                                  : result.timedOut
                                    ? "Timed out"
                                    : "Failed"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-text-muted">
                          <span>Pass rate</span>
                          <span>
                            {Math.round(
                              (selected.passedCount / Math.max(selected.totalCount, 1)) * 100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-status-accepted"
                            style={{
                              width: `${Math.round(
                                (selected.passedCount / Math.max(selected.totalCount, 1)) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {selected.output ? (
                      <div className="space-y-1.5 rounded-md border border-border-hairline bg-surface-base p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wide text-text-muted">Output</p>
                          <button
                            type="button"
                            onClick={() => copyText(selected.output ?? "", "output")}
                            className="flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-text-primary"
                          >
                            {copiedTarget === "output" ? (
                              <CheckCircle2 className="h-3 w-3 text-status-accepted" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy
                          </button>
                        </div>
                        <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-text-primary">
                          {selected.output}
                        </pre>
                      </div>
                    ) : null}

                    <div className="overflow-hidden rounded-md border border-border-hairline">
                      <div className="flex items-center justify-between border-b border-border-hairline bg-surface-container-low px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <FileCode2 className="h-3.5 w-3.5 text-text-muted" />
                          <span className="font-mono text-[11px] text-text-primary">
                            solution.{LANGUAGE_EXTENSIONS[selected.language] ?? selected.language}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyText(selected.code, "code")}
                            className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                          >
                            {copiedTarget === "code" ? (
                              <CheckCircle2 className="h-3 w-3 text-status-accepted" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy
                          </button>
                          <Button variant="ghost" size="sm" onClick={() => openInEditor(selected)}>
                            Open in editor
                            <ArrowRight />
                          </Button>
                        </div>
                      </div>

                      <div className="h-64">
                        <MonacoEditor
                          height="100%"
                          language={selected.language}
                          value={selected.code}
                          beforeMount={defineObsidianTheme}
                          theme={OBSIDIAN_THEME}
                          options={{
                            readOnly: true,
                            domReadOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 12,
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            lineNumbers: "on",
                            renderLineHighlight: "none",
                            padding: { top: 8, bottom: 8 },
                            scrollbar: { verticalScrollbarSize: 5 },
                            overviewRulerBorder: false,
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-text-muted">
                      Submitted {formatDateTime(selected.createdAt)}
                    </p>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-6">
                  <EmptyState
                    icon={History}
                    title="Select a submission"
                    description="Choose a row to inspect the verdict, test results, and source code."
                    className="border-0 bg-transparent"
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-text-muted">
          Most used language: {languageSummary}
        </p>
      </main>
    </div>
  );
}
