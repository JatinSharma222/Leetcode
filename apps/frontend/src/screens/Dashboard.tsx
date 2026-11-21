import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Circle,
  History,
  RotateCcw,
  Search,
  Shuffle,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/ui/Navbar";
import StatsOverview from "@/components/ui/StatsOverview";
import ActivityHeatmap from "@/components/ui/ActivityHeatmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAllQuestions,
  fetchSubmissionStats,
  getBookmarkedProblemIds,
  toggleBookmarkedProblem,
} from "@/lib/api";
import type { DifficultyLevel, Question, UserStats } from "@/lib/types";
import { getDifficultyMeta, getModifierKey } from "@/lib/ui";
import { usePageTitle } from "@/lib/usePageTitle";

type DifficultyFilter = "All" | DifficultyLevel;
type StatusFilter = "All" | "Solved" | "Unsolved" | "Bookmarked";

export default function Dashboard() {
  usePageTitle("Problems");

  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modifier = getModifierKey();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionList, userStats] = await Promise.all([
        fetchAllQuestions(),
        fetchSubmissionStats(),
      ]);
      setQuestions(questionList);
      setStats(userStats);
      setBookmarkedIds(new Set(getBookmarkedProblemIds()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the problem set.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const solvedQuestionIds = useMemo(
    () => new Set(stats?.solvedQuestionIds ?? []),
    [stats],
  );

  const questionNumbers = useMemo(
    () => new Map(questions.map((question, index) => [question.id, index + 1])),
    [questions],
  );

  const categories = useMemo(
    () =>
      [...new Set(questions.map((question) => question.category).filter(Boolean) as string[])].sort(
        (a, b) => a.localeCompare(b),
      ),
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return questions.filter((question) => {
      if (query) {
        const haystack = [
          question.title,
          question.id,
          question.category ?? "",
          question.difficulty ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (difficultyFilter !== "All" && question.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== "All" && question.category !== categoryFilter) return false;

      const isSolved = solvedQuestionIds.has(question.id);
      if (statusFilter === "Solved" && !isSolved) return false;
      if (statusFilter === "Unsolved" && isSolved) return false;
      if (statusFilter === "Bookmarked" && !bookmarkedIds.has(question.id)) return false;

      return true;
    });
  }, [
    questions,
    searchQuery,
    difficultyFilter,
    categoryFilter,
    statusFilter,
    solvedQuestionIds,
    bookmarkedIds,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    difficultyFilter !== "All" ||
    statusFilter !== "All" ||
    categoryFilter !== "All";

  const resetFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("All");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  const handleToggleBookmark = (question: Question) => {
    const isBookmarked = toggleBookmarkedProblem(question.id);
    setBookmarkedIds(new Set(getBookmarkedProblemIds()));
    toast(isBookmarked ? "Problem bookmarked" : "Bookmark removed", {
      description: question.title,
    });
  };

  const handlePickRandom = () => {
    if (questions.length === 0) return;
    const unsolved = questions.filter((question) => !solvedQuestionIds.has(question.id));
    const pool = unsolved.length > 0 ? unsolved : questions;
    const randomQuestion = pool[Math.floor(Math.random() * pool.length)];
    if (randomQuestion) navigate(`/problem/${randomQuestion.id}`);
  };

  return (
    <div className="min-h-screen bg-surface-base font-sans text-text-primary">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Problem set
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Problems</h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              Browse the library, track what you have solved, and jump back into practice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handlePickRandom} disabled={questions.length === 0}>
              <Shuffle />
              Random problem
            </Button>
            <Button variant="outline" asChild>
              <Link to="/submissions">
                <History />
                Submissions
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
                  <p className="text-sm font-medium text-text-primary">Could not load the problem set</p>
                  <p className="mt-0.5 text-xs text-text-muted">{error}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={loadData}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <StatsOverview stats={stats} loading={loading} />

        <Card className="mt-6 overflow-hidden">
          <CardHeader className="gap-3 border-b border-border-hairline sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">All problems</CardTitle>
              <p className="mt-1 text-xs text-text-muted">
                {loading
                  ? "Loading problems…"
                  : `${filteredQuestions.length} of ${questions.length} problems`}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw />
                Clear filters
              </Button>
            ) : null}
          </CardHeader>

          <div className="flex flex-col gap-3 border-b border-border-hairline p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <Input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title, topic, or ID"
                aria-label="Search problems"
                className="pl-9 pr-16"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border-hairline bg-surface-container px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:block">
                {modifier}K
              </kbd>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
              <Select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
                aria-label="Filter by difficulty"
                className="lg:w-32"
              >
                <option value="All">Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>

              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="lg:w-36"
              >
                <option value="All">Status</option>
                <option value="Solved">Solved</option>
                <option value="Unsolved">Unsolved</option>
                <option value="Bookmarked">Bookmarked</option>
              </Select>

              <Select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by topic"
                className="col-span-2 sm:col-span-1 lg:w-48"
              >
                <option value="All">All topics</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-hairline bg-surface-container-low/40 text-[11px] uppercase tracking-wide text-text-muted">
                  <th scope="col" className="w-12 px-4 py-3 text-center font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Problem
                  </th>
                  <th scope="col" className="w-28 px-4 py-3 font-medium">
                    Difficulty
                  </th>
                  <th scope="col" className="hidden w-56 px-4 py-3 font-medium lg:table-cell">
                    Topic
                  </th>
                  <th scope="col" className="hidden w-20 px-4 py-3 text-right font-medium sm:table-cell">
                    Tests
                  </th>
                  <th scope="col" className="w-32 px-4 py-3 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-hairline">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 text-center">
                        <Skeleton className="mx-auto h-4 w-4 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-56" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="hidden px-4 py-4 lg:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="hidden px-4 py-4 sm:table-cell">
                        <Skeleton className="ml-auto h-4 w-8" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="ml-auto h-7 w-20" />
                      </td>
                    </tr>
                  ))
                ) : filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={Search}
                        title={questions.length === 0 ? "No problems available" : "No matching problems"}
                        description={
                          questions.length === 0
                            ? "The problem library is empty. Add problems to the database to get started."
                            : "Try a different search term or clear the active filters."
                        }
                        className="rounded-none border-0 bg-transparent"
                        action={
                          questions.length === 0 ? undefined : (
                            <Button variant="secondary" size="sm" onClick={resetFilters}>
                              Clear filters
                            </Button>
                          )
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((question) => {
                    const isSolved = solvedQuestionIds.has(question.id);
                    const isBookmarked = bookmarkedIds.has(question.id);
                    const difficulty = getDifficultyMeta(question.difficulty);
                    const number = questionNumbers.get(question.id) ?? 0;

                    return (
                      <tr
                        key={question.id}
                        onClick={() => navigate(`/problem/${question.id}`)}
                        className="group cursor-pointer transition-colors hover:bg-surface-hover/50"
                      >
                        <td className="px-4 py-3.5 text-center">
                          {isSolved ? (
                            <CheckCircle2
                              className="mx-auto h-4 w-4 text-status-accepted"
                              aria-label="Solved"
                            />
                          ) : (
                            <Circle
                              className="mx-auto h-4 w-4 text-text-muted/40"
                              aria-label="Not solved"
                            />
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <Link
                              to={`/problem/${question.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="flex min-w-0 items-center gap-2 text-sm font-medium text-text-primary transition-colors group-hover:text-primary"
                            >
                              <span className="font-mono text-xs text-text-muted">{number}.</span>
                              <span className="truncate">{question.title}</span>
                            </Link>
                            <span className="text-[11px] text-text-muted lg:hidden">
                              {question.category ?? "Uncategorized"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant={difficulty.tone} className="gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${difficulty.dotClass}`} />
                            {difficulty.label}
                          </Badge>
                        </td>

                        <td className="hidden px-4 py-3.5 lg:table-cell">
                          <span className="text-xs text-text-secondary">
                            {question.category ?? "—"}
                          </span>
                        </td>

                        <td className="hidden px-4 py-3.5 text-right font-mono text-xs text-text-muted sm:table-cell">
                          {question._count?.testCases ?? "—"}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleToggleBookmark(question);
                              }}
                              aria-label={
                                isBookmarked
                                  ? `Remove bookmark from ${question.title}`
                                  : `Bookmark ${question.title}`
                              }
                              aria-pressed={isBookmarked}
                            >
                              <Star
                                className={isBookmarked ? "fill-current text-status-warning" : undefined}
                              />
                            </Button>

                            <Button
                              variant={isSolved ? "secondary" : "primary"}
                              size="sm"
                              asChild
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Link to={`/problem/${question.id}`}>
                                {isSolved ? "Review" : "Solve"}
                                <ArrowRight />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-6">
          <ActivityHeatmap
            activity={stats?.activity ?? {}}
            totalSubmissions={stats?.totalSubmissions ?? 0}
            activeDays={stats?.activeDays ?? 0}
            currentStreak={stats?.currentStreak ?? 0}
          />
        </div>

        {!loading && questions.length > 0 && questions.length >= 100 ? (
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-text-muted">
            <Bookmark className="h-3 w-3" />
            Showing the first 100 problems. Use search to narrow the list.
          </p>
        ) : null}
      </main>
    </div>
  );
}
