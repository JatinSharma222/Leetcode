import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  ArrowUpRight,
  AlertTriangle,
  Terminal,
  CheckCircle2,
  Circle,
  Shuffle,
  Tag,
  Filter,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import StatsOverview from "@/components/ui/StatsOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Question, Submission } from "@/lib/types";
import { fetchQuestions, fetchUserSubmissions } from "@/lib/api";

const DIFFICULTY_MAP: Record<string, { label: "Easy" | "Medium" | "Hard"; color: string; bg: string }> = {
  "sum-two-numbers": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "reverse-string": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  fizzbuzz: { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "palindrome-check": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  factorial: { label: "Medium", color: "text-medium", bg: "bg-medium/10 border-medium/30" },
  "max-in-array": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "gcd-two-numbers": { label: "Medium", color: "text-medium", bg: "bg-medium/10 border-medium/30" },
  "count-vowels": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "two-sum": { label: "Medium", color: "text-medium", bg: "bg-medium/10 border-medium/30" },
  "binary-to-decimal": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
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
    if (submissions.length === 0) return 0;
    const successful = submissions.filter((s) => s.status === "Success").length;
    return Math.round((successful / submissions.length) * 1000) / 10;
  }, [submissions]);

  // Filtered problems list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter
      const matchSearch =
        q.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchSearch) return false;

      // Difficulty filter
      const qDiff = DIFFICULTY_MAP[q.id]?.label || "Easy";
      if (difficultyFilter !== "All" && qDiff !== difficultyFilter) return false;

      // Status filter
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Terminal className="h-3.5 w-3.5" />
              Curated Practice Studio
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Algorithmic Archives
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
              Sharpen your problem-solving intuition with curated algorithmic challenges, evaluated live with microsecond precision.
            </p>
          </div>

          <Button
            onClick={handlePickRandom}
            variant="default"
            size="default"
            className="flex items-center gap-2 self-start md:self-auto font-medium"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Random Challenge
          </Button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-fail/30 bg-fail/10 px-4 py-3 text-sm text-fail">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <StatsOverview
          totalQuestions={questions.length}
          solvedCount={solvedQuestionIds.size}
          totalSubmissions={submissions.length}
          acceptanceRate={acceptanceRate}
          easySolved={easySolved}
          easyTotal={easyQuestions.length}
          mediumSolved={mediumSolved}
          mediumTotal={mediumQuestions.length}
          hardSolved={hardSolved}
          hardTotal={hardQuestions.length}
        />

        {/* Filter & Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9.5 pl-9 text-xs border-border bg-card placeholder:text-muted-foreground/60 rounded-lg shadow-[inset_0_1px_2px_rgba(93,7,3,0.05)] focus-visible:ring-primary/20"
            />
          </div>

          {/* Difficulty and Status Filter Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs shadow-xs">
              {(["All", "Easy", "Medium"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    difficultyFilter === diff
                      ? "bg-primary text-primary-foreground font-semibold shadow-[0_1px_3px_rgba(93,7,3,0.2)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs shadow-xs">
              {(["All", "Solved", "Unsolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground font-semibold shadow-[0_1px_3px_rgba(93,7,3,0.2)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_4px_16px_rgba(93,7,3,0.06)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 w-16 text-center">Status</th>
                <th scope="col" className="px-5 py-3">Challenge</th>
                <th scope="col" className="px-5 py-3 w-32">Difficulty</th>
                <th scope="col" className="px-5 py-3 hidden md:table-cell w-40">Categories</th>
                <th scope="col" className="px-5 py-3 hidden sm:table-cell text-right w-24">Tests</th>
                <th scope="col" className="px-5 py-3 text-right w-28">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2 font-mono text-xs">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading challenge archives...
                    </div>
                  </td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-muted-foreground text-xs font-sans">
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
                    color: "text-easy",
                    bg: "bg-easy/10 border-easy/30",
                  };
                  const topicsList = TOPICS_MAP[q.id] || ["Algorithms"];

                  return (
                    <tr
                      key={q.id}
                      className="group transition-colors hover:bg-secondary/40"
                    >
                      {/* Solved Status Icon */}
                      <td className="px-5 py-3.5 text-center align-middle">
                        {isSolved ? (
                          <CheckCircle2 className="h-4 w-4 text-pass inline" />
                        ) : (
                          <span className="text-muted-foreground/40 text-xs font-mono">—</span>
                        )}
                      </td>

                      {/* Problem Title & Number */}
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/problem/${q.id}`}
                          className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <span className="font-mono text-muted-foreground/70 text-xs">
                            {idx + 1}.
                          </span>
                          <span>{q.title}</span>
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
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary/70 border border-border/50 text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Tests count */}
                      <td className="px-5 py-3.5 hidden sm:table-cell text-right font-mono text-xs text-muted-foreground">
                        {q._count?.testCases ?? "—"}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/problem/${q.id}`}>
                          <Button
                            size="sm"
                            variant={isSolved ? "secondary" : "default"}
                            className="h-7 px-3 text-xs"
                          >
                            {isSolved ? "Review" : "Solve"}
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
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