import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Shuffle,
  Tag,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import StatsOverview from "@/components/ui/StatsOverview";
import ActivityHeatmap from "@/components/ui/ActivityHeatmap";
import type { Question, Submission } from "@/lib/types";
import { fetchQuestions, fetchUserSubmissions } from "@/lib/api";

const DIFFICULTY_MAP: Record<string, { label: "Easy" | "Medium" | "Hard"; color: string; bg: string }> = {
  "sum-two-numbers": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "reverse-string": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  fizzbuzz: { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "palindrome-check": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  factorial: { label: "Medium", color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  "max-in-array": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "gcd-two-numbers": { label: "Medium", color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  "count-vowels": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "two-sum": { label: "Medium", color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  "binary-to-decimal": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
};

const TOPICS_MAP: Record<string, string[]> = {
  "sum-two-numbers": ["Math", "Basic I/O"],
  "reverse-string": ["Two Pointers", "String"],
  fizzbuzz: ["Math", "Simulation"],
  "palindrome-check": ["Two Pointers", "String"],
  factorial: ["Math", "Recursion"],
  "max-in-array": ["Array", "Linear Search"],
  "gcd-two-numbers": ["Math", "Euclidean Algorithm"],
  "count-vowels": ["String", "Hash Table"],
  "two-sum": ["Array", "Hash Table"],
  "binary-to-decimal": ["Math", "Bit Manipulation"],
};

export default function Dashboard() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Solved" | "Unsolved">("All");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [questionsData, submissionsData] = await Promise.all([
          fetchQuestions(),
          fetchUserSubmissions().catch(() => []),
        ]);
        setQuestions(questionsData);
        setSubmissions(submissionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load problems.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const solvedQuestionIds = useMemo(
    () => new Set(submissions.filter((s) => s.status === "Success").map((s) => s.questionId)),
    [submissions],
  );

  // Breakdown counts
  const easyQuestions = questions.filter((q) => (DIFFICULTY_MAP[q.id]?.label || "Easy") === "Easy");
  const mediumQuestions = questions.filter((q) => DIFFICULTY_MAP[q.id]?.label === "Medium");
  const hardQuestions = questions.filter((q) => DIFFICULTY_MAP[q.id]?.label === "Hard");

  const easySolved = easyQuestions.filter((q) => solvedQuestionIds.has(q.id)).length;
  const mediumSolved = mediumQuestions.filter((q) => solvedQuestionIds.has(q.id)).length;
  const hardSolved = hardQuestions.filter((q) => solvedQuestionIds.has(q.id)).length;

  const acceptanceRate = useMemo(() => {
    if (submissions.length === 0) return 78.2;
    const successful = submissions.filter((s) => s.status === "Success").length;
    return Math.round((successful / submissions.length) * 1000) / 10;
  }, [submissions]);

  // Filtered problems list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        q.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (TOPICS_MAP[q.id] || []).some((t) => t.toLowerCase().includes(searchQuery.trim().toLowerCase()));
      if (!matchSearch) return false;

      const qDiff = DIFFICULTY_MAP[q.id]?.label || "Easy";
      if (difficultyFilter !== "All" && qDiff !== difficultyFilter) return false;

      const isSolved = solvedQuestionIds.has(q.id);
      if (statusFilter === "Solved" && !isSolved) return false;
      if (statusFilter === "Unsolved" && isSolved) return false;

      return true;
    });
  }, [questions, searchQuery, difficultyFilter, statusFilter, solvedQuestionIds]);

  const handlePickRandom = () => {
    if (questions.length === 0) return;
    const unsolved = questions.filter((q) => !solvedQuestionIds.has(q.id));
    const pool = unsolved.length > 0 ? unsolved : questions;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    if (randomQ) {
      navigate(`/problem/${randomQ.id}`);
    }
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary font-sans">
      <Navbar onSearchFocus={focusSearch} />

      <main className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-status-error/30 bg-status-error/10 px-4 py-3 text-xs text-status-error">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* SECTION 1: Gamified Hero & Momentum Grid */}
        <StatsOverview
          totalQuestions={questions.length || 10}
          solvedCount={solvedQuestionIds.size}
          totalSubmissions={submissions.length}
          acceptanceRate={acceptanceRate}
          easySolved={easySolved}
          easyTotal={easyQuestions.length || 7}
          mediumSolved={mediumSolved}
          mediumTotal={mediumQuestions.length || 3}
          hardSolved={hardSolved}
          hardTotal={hardQuestions.length || 1}
          dailyQuestion={questions[0] || null}
        />

        {/* SECTION 2: 365-Day Activity Ledger & Submission Heatmap */}
        <ActivityHeatmap submissions={submissions} />

        {/* SECTION 3: Filter & Search Command Toolbar */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box with cmd+K */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search problems, algorithms, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-12 text-xs bg-surface-elevated text-text-primary placeholder:text-text-muted rounded-lg border border-white/10 shadow-inner focus:outline-none focus:border-primary-container transition-colors"
            />
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-base text-text-muted border border-white/10 absolute right-2.5 top-1/2 -translate-y-1/2 select-none">
              ⌘K
            </kbd>
          </div>

          {/* Difficulty, Status & Shuffle Pills */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Difficulty Filter */}
            <div className="flex items-center rounded-lg border border-white/5 bg-surface-elevated p-1 text-xs">
              {(["All", "Easy", "Medium"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    difficultyFilter === diff
                      ? "bg-surface-hover text-text-primary font-semibold shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center rounded-lg border border-white/5 bg-surface-elevated p-1 text-xs">
              {(["All", "Solved", "Unsolved"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-surface-hover text-text-primary font-semibold shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Pick Random */}
            <button
              type="button"
              onClick={handlePickRandom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface-container-high text-text-primary text-xs font-medium border border-white/5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Shuffle className="h-3 w-3 text-status-warning" />
              <span>Random</span>
            </button>
          </div>
        </div>

        {/* SECTION 4: Problem Directory Table */}
        <div className="overflow-hidden rounded-xl border border-white/5 bg-surface-elevated shadow-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-white/5 bg-surface-container-low/60 text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 w-16 text-center">Status</th>
                <th scope="col" className="px-5 py-3">Challenge</th>
                <th scope="col" className="px-5 py-3 w-28">Difficulty</th>
                <th scope="col" className="px-5 py-3 hidden md:table-cell w-44">Categories</th>
                <th scope="col" className="px-5 py-3 hidden sm:table-cell text-right w-24">Tests</th>
                <th scope="col" className="px-5 py-3 text-right w-28">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-text-muted">
                    <div className="inline-flex items-center gap-2 font-mono text-xs">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
                      Loading challenge archives...
                    </div>
                  </td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-text-muted text-xs font-sans">
                    {questions.length === 0
                      ? "No problems found in the archive."
                      : "No problems match your current criteria."}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isSolved = solvedQuestionIds.has(q.id);
                  const diffObj = DIFFICULTY_MAP[q.id] || {
                    label: "Easy",
                    color: "text-status-accepted",
                    bg: "bg-status-accepted/10 border-status-accepted/20",
                  };
                  const topicsList = TOPICS_MAP[q.id] || ["Algorithms"];

                  return (
                    <tr
                      key={q.id}
                      className="group transition-colors hover:bg-surface-hover/50 cursor-pointer"
                      onClick={() => navigate(`/problem/${q.id}`)}
                    >
                      {/* Solved Status Icon */}
                      <td className="px-5 py-3.5 text-center align-middle">
                        {isSolved ? (
                          <CheckCircle2 className="h-4 w-4 text-status-accepted inline" />
                        ) : (
                          <span className="text-text-muted/30 text-xs font-mono">—</span>
                        )}
                      </td>

                      {/* Problem Title & Number */}
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/problem/${q.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-text-primary group-hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <span className="font-mono text-text-muted text-xs">
                            #{idx + 1}
                          </span>
                          <span className="font-sans text-sm">{q.title}</span>
                        </Link>
                      </td>

                      {/* Difficulty Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono border ${diffObj.bg} ${diffObj.color}`}
                        >
                          {diffObj.label}
                        </span>
                      </td>

                      {/* Topics */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {topicsList.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-container text-text-secondary border border-white/5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Tests count */}
                      <td className="px-5 py-3.5 hidden sm:table-cell text-right font-mono text-xs text-text-muted">
                        {q._count?.testCases ?? "—"}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/problem/${q.id}`} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={`h-7 px-3 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer ${
                              isSolved
                                ? "bg-surface-hover hover:bg-surface-container-high text-text-secondary hover:text-text-primary border border-white/5"
                                : "bg-primary-container hover:bg-brand-wine-deep text-on-primary-container shadow-sm shadow-primary-container/20"
                            }`}
                          >
                            <span>{isSolved ? "Review" : "Solve"}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}